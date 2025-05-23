# 碳足迹评估多 Agent 系统设计

## 1. 简介

本文档旨在设计一个基于多 Agent 架构的碳足迹评估系统。该系统旨在通过将复杂的 LCA (Life Cycle Assessment) 流程分解为由专门的子 Agent 处理的独立任务，来提高评估的效率、准确性、可维护性和自动化程度。主 Agent (Orchestrator) 负责协调流程和用户交互，而子 Agent 则专注于执行特定的专业任务。

采用多 Agent 架构的主要优势包括：

*   **模块化:** 每个 Agent 都是一个独立的单元，易于开发、测试和维护。
*   **专业化:** 每个 Agent 可以专注于其核心领域，从而提高任务执行的质量和可靠性。
*   **灵活性和可扩展性:** 可以根据需要轻松添加、移除或更新 Agent，适应不断变化的需求或标准。
*   **降低复杂度:** 将大型复杂问题分解为更小、更易于管理的部分。

## 2. 核心 Agents 设计

以下是构成碳足迹评估系统的核心子 Agent 的设计：

---

### 2.1 Orchestrator Agent (协调/母 Agent)

*   **角色 (Role):** 作为系统的总协调者和用户交互的主要接口，引导用户完成整个碳足迹评估流程。
*   **核心职责 (Core Responsibilities):**
    *   管理用户对话流程，理解用户意图和需求。
    *   根据当前评估阶段，调用相应的子 Agent 或工具。
    *   收集和传递子 Agent 所需的输入信息。
    *   接收子 Agent 的输出结果，并将其呈现给用户或传递给下一个 Agent。
    *   维护整个评估流程的状态。
    *   处理子 Agent 执行过程中的错误或异常情况。
    *   根据 AI 打分面板和计算结果，向用户提出优化建议。
*   **具体任务 (Specific Tasks):**
    *   进行初始需求收集（产品信息、评估范围、标准等）。
    *   提示用户上传所需文件（BOM、能耗数据等）。
    *   调用 `CsvParserAgent` 处理上传的文件。
    *   调用 `CarbonFactorAgent` 查询排放因子。
    *   调用 `LcaCalculationAgent` 执行碳足迹计算。
    *   调用 `DataQualityAgent` 评估数据质量。
    *   调用 `ReportGeneratorAgent` 生成最终报告。
    *   调用 `SupplyChainAgent` (如果需要) 与供应商沟通。
    *   向用户解释各阶段结果和下一步操作。
    *   管理 `carbonflow` 模型的操作（如添加、更新节点，布局等）。
*   **实现方式建议 (Implementation Recommendation):** **主要基于 LLM (Large Language Model)**
    *   **LLM:** 处理自然语言对话、理解用户多样化的输入和意图、管理复杂的评估流程状态、生成引导性问题和解释。
    *   **Code:** 通过函数调用 (Function Calling) 或工具使用 (Tool Use) 来执行对其他子 Agent 或 API 的调用、处理结构化数据传递、执行简单的状态检查。

---

### 2.2 CsvParserAgent (CSV 解析 Agent)

*   **角色 (Role):** 专门负责解析用户上传的 CSV 文件，提取结构化数据并映射到标准格式。
*   **核心职责 (Core Responsibilities):**
    *   接收原始 CSV 文本内容。
    *   识别 CSV 中的数据结构和潜在的生命周期阶段。
    *   根据预设规则或 Prompt 指导，提取关键信息。
    *   将提取的数据转换为系统内部定义的标准 JSON 格式。
    *   处理数据缺失或格式错误。
*   **具体任务 (Specific Tasks):**
    *   接收 CSV 文件内容字符串。
    *   尝试识别 Header 行。
    *   根据 Prompt 指导，为每一行确定最合适的 `nodeType`（例如 'product', 'manufacturing'）。
    *   为每一行提取一个清晰、非空的 `label` 字符串。
    *   根据识别的 `nodeType` 和 Prompt 中定义的字段要求，从 CSV 行中提取相关数据（如 'weight', 'material', 'energyConsumption' 等），并将 CSV Header 语义映射到标准字段名。
    *   处理空值或无法解析的值（例如，填充默认值、标记为空或报告错误）。
    *   将每一行有效数据格式化为 `{ nodeType: '...', data: { label: '...', fieldName1: value1, ... } }` 的 JSON 对象。
    *   输出一个包含所有成功解析的行的 JSON 数组。
    *   报告解析过程中遇到的错误或无法处理的行。
*   **实现方式建议 (Implementation Recommendation):** **混合实现 (LLM + Rule-based Code)**
    *   **LLM:** 理解 CSV 列的语义、识别 `nodeType`、提取 `label`、将不同的列名映射到标准化的 `data` 字段名（这是 LLM 的强项）。
    *   **Code:** 严格验证输出是否为有效的 JSON 数组和对象结构；可能需要进行 CSV 文本的预处理或基本的行/列分割（如果 LLM 直接处理原始文本效果不佳）；处理和格式化错误信息。

---

### 2.3 CarbonFactorAgent (碳因子匹配 Agent)

*   **角色 (Role):** 根据节点信息，从一个或多个碳排放因子数据库中查询、匹配并选择最合适的排放因子。
*   **核心职责 (Core Responsibilities):**
    *   接收节点数据（包含材料、工艺、地点、运输方式等信息）。
    *   连接并查询配置好的碳因子数据库。
    *   根据匹配规则（如地理位置、时间、技术代表性）筛选因子。
    *   处理单位转换。
    *   评估并选择最合适的因子，可能提供备选项和置信度。
    *   返回选定的因子值及其元数据（来源、质量评分等）。
*   **具体任务 (Specific Tasks):**
    *   接收一个或多个节点的详细数据。
    *   根据节点信息构建数据库查询语句（可能需要语义理解）。
    *   执行对 Ecoinvent、国家数据库或其他指定数据库的查询。
    *   根据地理、时间、技术等元数据过滤返回的因子。
    *   执行必要的单位换算（例如，从 kg CO2e/ton 转换为 kg CO2e/kg）。
    *   应用预设规则或模型来评估因子质量和适用性。
    *   选择最佳因子，并可能返回其来源、评分等信息。
    *   处理查询无结果或匹配不佳的情况。
*   **实现方式建议 (Implementation Recommendation):** **混合实现 (LLM + Rule-based Code)**
    *   **LLM:** 理解节点数据中的自然语言描述（如材料名称 "6061 铝合金"、工艺 "热流道注塑"），将其转换为更适合数据库查询的关键词或分类。
    *   **Code:** 执行精确的数据库查询；实现复杂的过滤和排序规则；进行精确的单位转换；管理数据库连接和 API 调用。

---

### 2.4 LcaCalculationAgent (LCA 计算 Agent)

*   **角色 (Role):** 基于构建好的生命周期模型和匹配到的排放因子，执行 LCA 计算。
*   **核心职责 (Core Responsibilities):**
    *   接收完整的生命周期模型数据（节点、边、节点数据含排放因子）。
    *   根据 LCA 标准（如 ISO 14040/14044）和模型结构，计算每个节点的碳排放量。
    *   处理节点间的物料流和能量流。
    *   应用分配规则（如果模型涉及多产品输出）。
    *   汇总计算总碳足迹以及各阶段的贡献。
    *   输出详细的计算结果。
*   **具体任务 (Specific Tasks):**
    *   遍历模型中的所有节点和边。
    *   对于每个节点，将其活动数据（如重量、距离、能耗）乘以对应的碳排放因子。
    *   根据模型连接关系，累加计算下游节点的输入影响。
    *   如果存在 co-product 或回收利用，根据选定的分配方法（如物理分配、经济分配）进行计算。
    *   汇总所有生命周期阶段的排放，得到总碳足迹。
    *   计算每个阶段对总排放的贡献百分比。
    *   返回结构化的计算结果，包括各节点排放、各阶段排放、总排放等。
*   **实现方式建议 (Implementation Recommendation):** **主要基于 Rule-based Code**
    *   **Code:** LCA 计算本质上是确定性的数学运算，使用代码实现可以保证准确性和可重复性。需要实现 LCA 计算引擎，遵循特定标准的方法论。
    *   **LLM:** （可选）用于解释计算结果或生成结果摘要的自然语言描述。

---

### 2.5 DataQualityAgent (数据质量与不确定性 Agent)

*   **角色 (Role):** 评估输入数据（活动数据和排放因子）的质量，并对计算结果进行不确定性分析。
*   **核心职责 (Core Responsibilities):**
    *   评估活动数据和排放因子的元数据（如来源、时间、地理、技术代表性）。
    *   根据预设规则或标准（如 GHG Protocol 的数据质量指标）为数据打分。
    *   基于数据质量评分和已知的不确定性分布（例如，排放因子的标准差），进行不确定性分析。
    *   量化最终碳足迹结果的不确定性范围。
*   **具体任务 (Specific Tasks):**
    *   分析节点数据中的 `activitydataSource`, `activityScore`, `verificationStatus` 等字段。
    *   分析 `CarbonFactorAgent` 返回的因子元数据。
    *   应用数据质量评分矩阵或算法，计算每个数据点的质量分数。
    *   （如果需要）为关键参数设定不确定性分布（如正态分布、对数正态分布）。
    *   （如果需要）执行蒙特卡洛模拟或其他不确定性传播方法。
    *   计算最终结果的置信区间（例如 95% 置信区间）。
    *   输出数据质量评估摘要和不确定性分析结果。
*   **实现方式建议 (Implementation Recommendation):** **混合实现 (LLM + Rule-based Code)**
    *   **LLM:** 理解数据来源描述等文本信息，辅助评估其可靠性。
    *   **Code:** 实现数据质量评分规则；执行不确定性分析的数学模型（如蒙特卡洛模拟需要大量计算）。

---

### 2.6 ReportGeneratorAgent (报告生成 Agent)

*   **角色 (Role):** 基于最终的 LCA 模型、计算结果、数据质量评估和不确定性分析，自动生成符合特定标准的碳足迹报告。
*   **核心职责 (Core Responsibilities):**
    *   接收所有计算结果和相关分析数据。
    *   根据用户选择的报告标准（ISO 14067, GHG Protocol 等）和模板。
    *   生成报告的各个章节内容（文本、表格、图表）。
    *   确保报告结构和内容符合标准要求。
    *   输出最终的报告文件（如 PDF, DOCX）。
*   **具体任务 (Specific Tasks):**
    *   接收 LCA 计算结果、数据质量评分、不确定性分析结果等。
    *   根据选定标准，确定报告必须包含的章节和内容。
    *   从输入数据中提取信息，填充到报告模板的相应位置。
    *   调用 LLM 生成报告中的描述性文本部分（如目标与范围描述、结果解释、结论与建议等）。
    *   调用代码库生成数据表格和图表（如各阶段贡献图）。
    *   将所有内容组合成完整的报告文档。
    *   执行格式检查，确保符合排版要求。
    *   输出指定格式的报告文件。
*   **实现方式建议 (Implementation Recommendation):** **混合实现 (LLM + Rule-based Code)**
    *   **LLM:** 撰写报告中的自然语言文本部分，如引言、方法描述、结果解释、建议等，使其流畅、专业且符合上下文。
    *   **Code:** 严格控制报告的整体结构和格式；精确填充数据表格；调用图表库生成图表；将各部分组合成最终文件；确保符合标准的强制性要求。

---

### 2.7 SupplyChainAgent (供应链协同 Agent) - 可选

*   **角色 (Role):** 在用户缺少一级供应商数据时，协助与供应商进行沟通以获取数据。
*   **核心职责 (Core Responsibilities):**
    *   根据缺失的数据项，生成标准化的数据请求模板。
    *   （可选）协助用户向供应商发送数据请求邮件。
    *   （可选，较复杂）接收并初步解析供应商的回复。
*   **具体任务 (Specific Tasks):**
    *   识别模型中数据缺失的节点及其所需信息。
    *   生成包含清晰数据项、单位、时间范围等要求的邮件或问卷模板。
    *   （需用户授权和提供联系方式）调用邮件 API 发送请求。
    *   （需集成邮件接收）接收邮件回复，尝试提取关键数据或判断回复状态。
*   **实现方式建议 (Implementation Recommendation):** **混合实现 (LLM + Rule-based Code)**
    *   **LLM:** 理解需要请求的数据项，生成自然、专业的邮件或问卷文本。
    *   **Code:** 管理邮件模板；调用邮件 API；（如果实现回复解析）应用规则或简单模型解析回复中的数据。

## 3. Agent 交互流程示例

一个典型的评估流程中，Agent 的交互可能如下：

1.  **用户** 与 **OrchestratorAgent** 交互，说明评估需求。
2.  **OrchestratorAgent** 提示用户上传 BOM 清单。
3.  **用户** 上传 CSV 文件。
4.  **OrchestratorAgent** 将 CSV 内容传递给 **CsvParserAgent**。
5.  **CsvParserAgent** 解析文件，返回结构化的节点数据 JSON。
6.  **OrchestratorAgent** 接收 JSON，更新 `carbonflow` 模型（调用 `create` 操作）。
7.  **OrchestratorAgent** 遍历新创建的节点，将节点信息传递给 **CarbonFactorAgent**。
8.  **CarbonFactorAgent** 查询数据库，返回匹配的排放因子。
9.  **OrchestratorAgent** 接收因子，更新 `carbonflow` 模型中对应节点的 `carbonFactor` 等数据（调用 `update` 操作）。
10. （重复步骤 2-9，收集和处理其他生命周期阶段的数据，如能耗、运输等）
11. **OrchestratorAgent** 确认模型基本完整后，调用 **LcaCalculationAgent**。
12. **LcaCalculationAgent** 执行计算，返回各节点和总体的碳足迹结果。
13. **OrchestratorAgent** 接收结果，更新 `carbonflow` 模型（如最终产品节点的 `carbonFootprint`）。
14. **OrchestratorAgent** 调用 **DataQualityAgent** 评估数据质量和不确定性。
15. **OrchestratorAgent** 接收评估结果，可能在界面上展示 AI 摘要分数。
16. **用户** 请求生成报告。
17. **OrchestratorAgent** 将所有相关数据传递给 **ReportGeneratorAgent**。
18. **ReportGeneratorAgent** 生成报告文件。
19. **OrchestratorAgent** 将报告文件提供给用户。

*注：此流程为简化示例，实际交互可能更复杂，包含更多循环和用户确认步骤。*

## 4. 通用设计考虑

*   **通信协议:** Agent 之间需要定义清晰、标准化的通信接口（例如，REST API、函数调用、消息队列）。数据格式应严格定义（如使用 TypeScript 接口或 JSON Schema）。
*   **错误处理:** 每个子 Agent 都应能处理其内部错误，并向 Orchestrator 返回明确的错误信息。Orchestrator 需要有策略来处理子 Agent 的失败（重试、询问用户、中止流程等）。
*   **状态管理:** Orchestrator 需要维护整个评估流程的状态。复杂的状态可以考虑使用外部状态存储。
*   **可观察性:** 实现日志记录、追踪和监控，以便调试和理解系统行为。

## 5. 结论

通过将碳足迹评估流程分解为多个专业的子 Agent，可以构建一个更强大、更准确、更易于维护和扩展的系统。每个 Agent 利用最适合其任务的技术（LLM 的理解与生成能力，或代码的精确与确定性），协同工作以完成复杂的 LCA 任务，最终为用户提供高质量的碳足迹评估服务和报告。