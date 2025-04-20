import React, { useState } from "react";
import { Button, Input, Upload, message, Tabs, Card, Select, Space, Tooltip } from "antd";
import { UploadOutlined, SearchOutlined, CloseOutlined, SaveOutlined, ExportOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import "../styles/ai-knowledge.css";

const { TextArea } = Input;
const { TabPane } = Tabs;
const { Option } = Select;

interface ChatMessage {
  type: "user" | "ai";
  content: string;
  time: string;
}

interface FileAnalysis {
  id: string;
  content: string;
  isDefault: boolean;
}

interface SearchResult {
  id: string;
  name: string;
  type: "标准法规" | "行业报告" | "LCA研究报告";
  industry: "通用" | "纺织" | "化工" | "钢铁" | "水泥" | "造纸" | "电力" | "航空" | "建筑" | "其他";
  publishDate: string;
}

// 示例搜索结果数据
const mockSearchResults: SearchResult[] = [
  {
    id: "1",
    name: "碳足迹计算标准指南.pdf",
    type: "标准法规",
    industry: "通用",
    publishDate: "2023-01-15"
  },
  {
    id: "2",
    name: "纺织行业碳排放报告.docx",
    type: "行业报告",
    industry: "纺织",
    publishDate: "2023-03-20"
  },
  {
    id: "3",
    name: "钢铁行业LCA研究报告.pdf",
    type: "LCA研究报告",
    industry: "钢铁",
    publishDate: "2023-05-10"
  },
  {
    id: "4",
    name: "水泥行业碳减排技术分析.pdf",
    type: "行业报告",
    industry: "水泥",
    publishDate: "2023-06-22"
  },
  {
    id: "5",
    name: "建筑行业碳排放核算方法.docx",
    type: "标准法规",
    industry: "建筑",
    publishDate: "2023-07-05"
  },
  {
    id: "6",
    name: "电力行业碳中和技术路线图.pdf",
    type: "行业报告",
    industry: "电力",
    publishDate: "2023-08-12"
  }
];

// 示例文件内容
const mockFileContents: Record<string, string> = {
  "碳足迹计算标准指南.pdf": `# 碳足迹计算标准指南

## 1. 引言

本指南旨在提供碳足迹计算的标准方法和流程，适用于各类组织和产品的碳足迹评估。

## 2. 术语和定义

- 碳足迹：产品、服务或组织在其生命周期内直接和间接产生的温室气体排放总量
- 温室气体：包括二氧化碳(CO₂)、甲烷(CH₄)、氧化亚氮(N₂O)等
- 功能单位：用于量化产品系统性能的参考单位

## 3. 计算范围

### 3.1 组织碳足迹

组织碳足迹包括：
- 范围一：直接排放（如燃料燃烧、公司车辆）
- 范围二：间接排放（如外购电力、热力）
- 范围三：其他间接排放（如供应链、产品使用）

### 3.2 产品碳足迹

产品碳足迹包括从原材料获取到产品处置的全生命周期排放。

## 4. 数据收集

### 4.1 活动数据

活动数据是指与排放源相关的物理量，如：
- 能源消耗量（kWh、m³、kg等）
- 原材料使用量
- 废弃物产生量

### 4.2 排放因子

排放因子是将活动数据转换为温室气体排放量的系数。

## 5. 计算方法

碳足迹计算公式：
碳足迹 = Σ(活动数据 × 排放因子)

## 6. 报告要求

碳足迹报告应包含：
- 计算范围和方法说明
- 数据来源和假设
- 计算结果和不确定性分析
- 减排建议

## 7. 附录

附录A：常用排放因子表
附录B：数据收集表格模板
附录C：不确定性评估方法`,
  
  "纺织行业碳排放报告.docx": `# 纺织行业碳排放报告

## 执行摘要

本报告分析了中国纺织行业的碳排放现状、趋势和减排潜力，为行业低碳转型提供参考。

## 1. 行业概况

中国纺织行业是国民经济重要支柱产业，2022年总产值达5.8万亿元，占GDP的4.8%。

## 2. 碳排放现状

### 2.1 排放总量

2022年纺织行业碳排放总量为1.2亿吨CO₂e，占全国工业排放的3.5%。

### 2.2 排放来源

主要排放来源：
- 能源消耗：45%
- 原材料生产：30%
- 废弃物处理：15%
- 运输物流：10%

### 2.3 区域分布

排放量前五省份：
1. 江苏：25%
2. 浙江：20%
3. 山东：15%
4. 广东：12%
5. 福建：8%

## 3. 减排技术

### 3.1 能源替代

- 可再生能源使用
- 清洁能源替代
- 能源梯级利用

### 3.2 工艺优化

- 智能制造
- 工艺改进
- 设备升级

### 3.3 材料创新

- 可再生材料
- 低碳材料
- 循环利用

## 4. 减排目标

到2025年，行业碳排放强度较2020年下降18%，到2030年下降35%。

## 5. 政策建议

- 完善碳交易机制
- 加强技术创新支持
- 建立行业标准体系
- 促进国际合作

## 6. 结论

纺织行业低碳转型面临挑战与机遇，需要政府、企业和消费者共同努力。`,
  
  "钢铁行业LCA研究报告.pdf": `# 钢铁行业生命周期评价(LCA)研究报告

## 摘要

本研究采用生命周期评价方法，对钢铁产品从原材料获取到最终处置的全生命周期环境影响进行了全面评估。

## 1. 研究背景

钢铁行业是能源密集型产业，也是碳排放重点行业，开展LCA研究对行业低碳发展具有重要意义。

## 2. 研究方法

### 2.1 功能单位

本研究以"1吨粗钢"为功能单位。

### 2.2 系统边界

包括：
- 原材料获取
- 能源生产
- 钢铁冶炼
- 产品加工
- 运输配送
- 使用阶段
- 废弃处置

### 2.3 环境影响类别

评估的环境影响类别包括：
- 全球变暖潜势(GWP)
- 酸化潜势(AP)
- 富营养化潜势(EP)
- 光化学臭氧生成潜势(POCP)
- 人体毒性潜势(HTP)
- 生态毒性潜势(ETP)
- 资源消耗(ADP)

## 3. 数据来源

### 3.1 主要数据来源

- 企业生产数据
- 行业统计年鉴
- 环境数据库
- 专家访谈

### 3.2 数据质量

数据代表性：80%
数据可靠性：85%
数据时效性：90%

## 4. 结果分析

### 4.1 全球变暖潜势

粗钢生产的全球变暖潜势为1.8吨CO₂e/吨钢，其中：
- 能源消耗：65%
- 原材料生产：25%
- 运输配送：8%
- 其他：2%

### 4.2 其他环境影响

- 酸化潜势：12.5 kg SO₂e/吨钢
- 富营养化潜势：3.2 kg PO₄e/吨钢
- 光化学臭氧生成潜势：0.8 kg C₂H₄e/吨钢

## 5. 敏感性分析

对结果影响最大的参数：
1. 能源结构
2. 原材料来源
3. 运输距离

## 6. 改进建议

### 6.1 技术改进

- 提高能源效率
- 发展低碳工艺
- 推广清洁能源

### 6.2 管理改进

- 优化供应链
- 加强废弃物回收
- 实施清洁生产

## 7. 结论

钢铁生产对环境有显著影响，通过技术创新和管理优化可有效降低环境影响。`
};

// 示例AI对话记录
const mockChatMessages: ChatMessage[] = [
  {
    type: "user",
    content: "你好，我想了解碳足迹计算的相关标准",
    time: "10:30"
  },
  {
    type: "ai",
    content: "您好！我可以帮您查找关于碳足迹计算标准的相关资料。根据知识库，我找到了《碳足迹计算标准指南》这份文档，它详细介绍了碳足迹计算的方法、范围和报告要求。您需要我为您打开这份文档吗？",
    time: "10:31"
  },
  {
    type: "user",
    content: "好的，请帮我打开这份文档",
    time: "10:32"
  },
  {
    type: "ai",
    content: "已为您打开《碳足迹计算标准指南》。这份文档包含碳足迹的定义、计算范围、数据收集方法、计算公式以及报告要求等内容。您对哪部分内容特别感兴趣？我可以帮您进一步解析。",
    time: "10:33"
  },
  {
    type: "user",
    content: "我想了解纺织行业的碳排放情况",
    time: "10:35"
  },
  {
    type: "ai",
    content: "我找到了《纺织行业碳排放报告》，这份报告详细分析了中国纺织行业的碳排放现状、趋势和减排潜力。根据报告，2022年纺织行业碳排放总量为1.2亿吨CO₂e，占全国工业排放的3.5%。主要排放来源包括能源消耗(45%)、原材料生产(30%)、废弃物处理(15%)和运输物流(10%)。您需要了解更多关于纺织行业减排技术的信息吗？",
    time: "10:36"
  }
];

const AIKnowledge: React.FC = () => {
  // 状态管理
  const [searchText, setSearchText] = useState("");
  const [searchPool, setSearchPool] = useState<"知识库" | "个人知识库">("知识库");
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("search");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [inputMessage, setInputMessage] = useState("");
  const [fileAnalyses, setFileAnalyses] = useState<Record<string, FileAnalysis>>({});
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [analysisTab, setAnalysisTab] = useState<"default" | "saved">("saved");

  // 模拟搜索功能
  const handleSearch = () => {
    if (!searchText.trim()) {
      message.warning("请输入搜索内容");
      return;
    }
    
    // 根据搜索文本过滤示例数据
    const filteredResults = mockSearchResults.filter(result => 
      result.name.toLowerCase().includes(searchText.toLowerCase()) ||
      result.type.toLowerCase().includes(searchText.toLowerCase()) ||
      result.industry.toLowerCase().includes(searchText.toLowerCase())
    );
    
    setSearchResults(filteredResults);
  };

  // 处理文件选择
  const handleFileSelect = (fileId: string) => {
    if (!openTabs.includes(fileId)) {
      setOpenTabs([...openTabs, fileId]);
    }
    setActiveTab(fileId);
    
    // 模拟文件分析结果
    if (!fileAnalyses[fileId]) {
      setFileAnalyses({
        ...fileAnalyses,
        [fileId]: {
          id: fileId,
          content: `这是对文件 ${fileId} 的AI解析结果：

1. 文档类型：${mockSearchResults.find(r => r.id === fileId)?.type || '未知'}
2. 适用行业：${mockSearchResults.find(r => r.id === fileId)?.industry || '未知'}
3. 发布时间：${mockSearchResults.find(r => r.id === fileId)?.publishDate || '未知'}

主要内容概述：
${fileId.includes('碳足迹') ? '该文档详细介绍了碳足迹计算的标准方法和流程，包括术语定义、计算范围、数据收集、计算方法和报告要求等。' : 
  fileId.includes('纺织') ? '该报告分析了中国纺织行业的碳排放现状、趋势和减排潜力，包括行业概况、排放现状、减排技术和政策建议等。' : 
  fileId.includes('钢铁') ? '该研究采用生命周期评价方法，对钢铁产品从原材料获取到最终处置的全生命周期环境影响进行了全面评估，包括研究方法、数据来源、结果分析和改进建议等。' : 
  '该文档提供了相关行业或领域的专业知识和信息。'}

关键要点：
- 文档提供了详细的方法论和标准
- 包含大量实际案例和数据
- 提供了具体的实施建议和最佳实践

AI建议：
建议结合行业实际情况，参考文档中的方法和标准，制定适合自身情况的碳减排方案。`,
          isDefault: true
        }
      });
    }
  };

  // 处理标签页关闭
  const handleTabClose = (fileId: string) => {
    setOpenTabs(openTabs.filter(id => id !== fileId));
    if (activeTab === fileId) {
      setActiveTab(openTabs[openTabs.indexOf(fileId) - 1] || "search");
    }
  };

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    try {
      // 模拟文件上传
      const fileId = file.name;
      setOpenTabs([...openTabs, fileId]);
      setActiveTab(fileId);
      
      // 模拟文件分析结果
      setFileAnalyses({
        ...fileAnalyses,
        [fileId]: {
          id: fileId,
          content: `这是对文件 ${file.name} 的默认AI解析结果：

1. 文档类型：上传文件
2. 适用行业：待分析
3. 上传时间：${new Date().toLocaleDateString()}

主要内容概述：
该文档是用户上传的个人文件，需要进一步分析其内容和结构。

AI建议：
建议对文档进行更深入的分析，提取关键信息，并与知识库中的相关内容进行关联。`,
          isDefault: true
        }
      });
      
      message.success("文件上传成功");
      return false; // 阻止默认上传行为
    } catch (error) {
      message.error("文件上传失败");
      return false;
    }
  };

  // 处理保存分析结果
  const handleSaveAnalysis = () => {
    if (!activeTab || activeTab === "search") {
      message.warning("请先选择一个文件");
      return;
    }
    
    const currentAnalysis = fileAnalyses[activeTab];
    if (currentAnalysis) {
      setFileAnalyses({
        ...fileAnalyses,
        [activeTab]: {
          ...currentAnalysis,
          isDefault: false
        }
      });
      message.success("分析结果已保存");
    }
  };

  // 处理发送消息
  const handleSendMessage = () => {
    if (!inputMessage.trim()) {
      message.warning("请输入消息内容");
      return;
    }

    const newMessage: ChatMessage = {
      type: "user",
      content: inputMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages([...chatMessages, newMessage]);
    setInputMessage("");

    // 模拟AI回复
    setTimeout(() => {
      let aiResponse = "";
      
      // 根据用户输入生成不同的AI回复
      if (inputMessage.toLowerCase().includes("碳足迹") || inputMessage.toLowerCase().includes("碳排放")) {
        aiResponse = "根据知识库中的资料，碳足迹是指产品、服务或组织在其生命周期内直接和间接产生的温室气体排放总量。计算碳足迹需要考虑范围一（直接排放）、范围二（间接排放）和范围三（其他间接排放）。您想了解更具体的计算方法吗？";
      } else if (inputMessage.toLowerCase().includes("纺织") || inputMessage.toLowerCase().includes("服装")) {
        aiResponse = "根据《纺织行业碳排放报告》，2022年纺织行业碳排放总量为1.2亿吨CO₂e，占全国工业排放的3.5%。主要排放来源包括能源消耗(45%)、原材料生产(30%)、废弃物处理(15%)和运输物流(10%)。您需要了解更多关于纺织行业减排技术的信息吗？";
      } else if (inputMessage.toLowerCase().includes("钢铁") || inputMessage.toLowerCase().includes("金属")) {
        aiResponse = "根据《钢铁行业LCA研究报告》，粗钢生产的全球变暖潜势为1.8吨CO₂e/吨钢，其中能源消耗占65%，原材料生产占25%，运输配送占8%。您想了解钢铁行业的具体减排措施吗？";
      } else if (inputMessage.toLowerCase().includes("你好") || inputMessage.toLowerCase().includes("hi") || inputMessage.toLowerCase().includes("hello")) {
        aiResponse = "您好！我是AI助手，可以帮您查找知识库中的资料，解析文件内容，或回答您的问题。您有什么需要帮助的吗？";
      } else {
        aiResponse = "我理解您的问题。根据知识库中的资料，我可以为您提供相关信息。您是否需要我为您搜索特定的文档或主题？";
      }
      
      const aiMessage: ChatMessage = {
        type: "ai",
        content: aiResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  // 获取当前选中文件的分析结果
  const getCurrentAnalysis = () => {
    if (!activeTab || activeTab === "search") return null;
    
    const analysis = fileAnalyses[activeTab];
    if (!analysis) return null;
    
    if (analysisTab === "saved" && !analysis.isDefault) {
      return analysis;
    } else if (analysisTab === "default" || (analysisTab === "saved" && analysis.isDefault)) {
      return analysis;
    }
    
    return null;
  };

  // 渲染标签页内容
  const renderTabContent = (tabKey: string) => {
    if (tabKey === "search") {
      return (
        <div className="search-section">
          <div className="search-bar">
            <Input
              placeholder="搜索文件..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              suffix={
                <Tooltip title="搜索">
                  <SearchOutlined onClick={handleSearch} style={{ cursor: 'pointer' }} />
                </Tooltip>
              }
            />
            <Select 
              value={searchPool} 
              onChange={(value) => setSearchPool(value)}
              style={{ width: 120 }}
            >
              <Option value="知识库">知识库</Option>
              <Option value="个人知识库">个人知识库</Option>
            </Select>
            {searchPool === "个人知识库" && (
              <Upload
                beforeUpload={handleFileUpload}
                showUploadList={false}
                accept=".txt,.pdf,.doc,.docx"
              >
                <Button icon={<UploadOutlined />}>上传</Button>
              </Upload>
            )}
          </div>
          
          {/* 搜索结果 */}
          {searchResults.length > 0 ? (
            <div className="search-results">
              {searchResults.map((result) => (
                <Card 
                  key={result.id} 
                  className="result-card"
                  onClick={() => handleFileSelect(result.id)}
                >
                  <div className="result-title">{result.name}</div>
                  <div className="result-info">
                    <span className="result-type">{result.type}</span>
                    <span className="result-industry">{result.industry}</span>
                    <span className="result-date">{result.publishDate}</span>
                  </div>
                </Card>
              ))}
            </div>
          ) : searchText ? (
            <div className="empty-search">
              未找到匹配的搜索结果，请尝试其他关键词
            </div>
          ) : (
            <div className="empty-search">
              请输入关键词搜索文件
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div className="file-text">
          {/* 文件内容预览 */}
          <pre className="file-content-pre">
            {mockFileContents[tabKey] || `文件内容预览区域: ${tabKey}`}
          </pre>
        </div>
      );
    }
  };

  return (
    <div className="ai-knowledge-container">
      <div className="ai-knowledge-content">
        {/* 左侧：AI解析结果展示区域 */}
        <div className="analysis-area">
          <div className="analysis-header">
            <h3>AI解析结果</h3>
            <Tabs 
              activeKey={analysisTab} 
              onChange={(key) => setAnalysisTab(key as "default" | "saved")}
              size="small"
            >
              <TabPane tab="保存的AI解析结果" key="saved" />
              <TabPane tab="知识库默认解析结果" key="default" />
            </Tabs>
          </div>
          <div className="analysis-content">
            {activeTab && activeTab !== "search" ? (
              <div className="analysis-result">
                <div className="analysis-text">
                  {getCurrentAnalysis()?.content || "无解析结果"}
                </div>
                <div className="analysis-actions">
                  <Button 
                    type="primary" 
                    icon={<SaveOutlined />}
                    onClick={handleSaveAnalysis}
                    disabled={!activeTab || (analysisTab === "default")}
                  >
                    保存
                  </Button>
                  <Button icon={<ExportOutlined />}>导出</Button>
                </div>
              </div>
            ) : (
              <div className="empty-analysis">
                选择知识库文件后展示AI解析结果
              </div>
            )}
          </div>
        </div>

        {/* 中侧：搜索及原文件展示区域 */}
        <div className="file-area">
          <div className="file-header">
            <h3>文件列表</h3>
          </div>
          
          {/* 文件标签页 */}
          <div className="file-tabs-container">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              type="editable-card"
              onEdit={(targetKey, action) => {
                if (action === 'remove' && targetKey !== 'search') {
                  handleTabClose(targetKey as string);
                }
              }}
              hideAdd
            >
              <TabPane tab="文档搜索" key="search" closable={false} />
              {openTabs.map((fileId) => (
                <TabPane tab={fileId} key={fileId} closable={true} />
              ))}
            </Tabs>
          </div>
          
          {/* 标签页内容 */}
          <div className="file-content">
            {renderTabContent(activeTab)}
          </div>
        </div>

        {/* 右侧：AI对话区域 */}
        <div className="chat-area">
          <div className="chat-header">
            <h3>AI对话</h3>
          </div>
          <div className="chat-messages">
            {chatMessages.map((message, index) => (
              <div key={index} className={`message ${message.type}`}>
                <div className="message-content">{message.content}</div>
                <div className="message-time">{message.time}</div>
              </div>
            ))}
          </div>
          <div className="chat-input">
            <TextArea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="输入消息..."
              autoSize={{ minRows: 2, maxRows: 6 }}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              type="primary"
              onClick={handleSendMessage}
            >
              发送
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIKnowledge; 