# 开发环境搭建指南

## 1. 概述

本文档提供了AI驱动的产品碳足迹量化平台的开发环境搭建指南。按照本指南设置的开发环境将支持前端、后端和AI组件的开发与测试。文档包含必要的软件安装、配置步骤和常见问题解决方案。

## 2. 系统要求

### 2.1 硬件建议配置

- **处理器**: Intel Core i7/AMD Ryzen 7 或更高
- **内存**: 16GB RAM (推荐32GB)
- **存储**: 至少256GB可用空间，SSD推荐
- **显卡**: 基本开发无特殊要求，AI模型训练可能需要NVIDIA GPU

### 2.2 支持的操作系统

- **Windows**: Windows 10/11 (专业版或企业版)
- **macOS**: Monterey (12.0) 或更高版本
- **Linux**: Ubuntu 20.04/22.04 LTS, Debian 11, CentOS/RHEL 8

## 3. 基础环境设置

### 3.1 安装Git

Git用于版本控制和团队协作。

**Windows**:

```
# 下载并安装Git for Windows
https://git-scm.com/download/win

# 配置Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

**macOS**:

```
# 使用Homebrew安装
brew install git

# 配置Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

**Linux**:

```
# Ubuntu/Debian
sudo apt update
sudo apt install git

# CentOS/RHEL
sudo yum install git

# 配置Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 3.2 安装Docker和Docker Compose

Docker用于容器化开发和测试环境。

**Windows/macOS**:

1. 下载并安装Docker Desktop: https://www.docker.com/products/docker-desktop
2. 启动Docker Desktop应用
3. 验证安装: `docker --version` 和 `docker-compose --version`

**Linux**:

```
# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 将当前用户添加到docker组
sudo usermod -aG docker $USER
newgrp docker

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.17.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

### 3.3 安装Node.js和pnpm

Node.js用于前端和API开发，pnpm用于依赖管理。

**所有操作系统**:

1. 使用nvm安装Node.js:

```
# 安装nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
# 或使用wget
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash

# 重新加载shell配置
source ~/.bashrc  # 或 ~/.zshrc

# 安装Node.js LTS版本
nvm install --lts
nvm use --lts

# 验证Node.js安装
node --version
```

2. 安装pnpm:

```
# 使用npm安装pnpm
npm install -g pnpm

# 验证pnpm安装
pnpm --version
```

### 3.4 安装Python环境(可选，用于AI组件开发)

Python环境用于AI模型开发和数据处理。

**Windows**:

1. 下载并安装Miniconda: https://docs.conda.io/en/latest/miniconda.html
2. 创建虚拟环境:

```
conda create -n carbon-ai python=3.10
conda activate carbon-ai
```

**macOS/Linux**:

```
# 安装Miniconda
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda.sh
bash ~/miniconda.sh -b -p $HOME/miniconda
rm ~/miniconda.sh
echo 'export PATH="$HOME/miniconda/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# 创建虚拟环境
conda create -n carbon-ai python=3.10
conda activate carbon-ai
```

### 3.5 安装数据库工具(可选)

用于直接操作和查看数据库。

**所有操作系统**:

- 安装DBeaver(通用数据库管理工具): https://dbeaver.io/download/
- 或安装pgAdmin(PostgreSQL专用): https://www.pgadmin.org/download/

## 4. 项目设置

### 4.1 获取源代码

```
# 克隆仓库
git clone https://github.com/your-org/carbon-footprint-platform.git
cd carbon-footprint-platform

# 切换到开发分支
git checkout develop
```

### 4.2 环境配置

```
# 复制环境变量示例文件
cp .env.example .env

# 编辑.env文件，配置必要的环境变量
# 使用你喜欢的编辑器，如:
nano .env  # 或 vim .env
```

主要配置项包括:

- 数据库连接信息
- API密钥和访问令牌
- 开发服务器端口设置
- 第三方服务配置

### 4.3 安装依赖

```
# 安装项目依赖
pnpm install
```

### 4.4 配置Docker开发环境

```
# 启动Docker容器
docker-compose -f docker-compose.dev.yml up -d

# 查看容器状态
docker-compose ps
```

### 4.5 数据库初始化

```
# 创建数据库结构
pnpm db:migrate

# 填充测试数据
pnpm db:seed
```

## 5. 启动开发服务

### 5.1 前端开发服务器

```
# 启动前端开发服务器
pnpm dev
```

默认情况下，前端服务器将在 http://localhost:3000 上运行

### 5.2 API服务器

```
# 启动API服务器
pnpm dev:api
```

默认情况下，API服务器将在 http://localhost:4000 上运行

### 5.3 AI服务(可选)

```
# 激活Python环境
conda activate carbon-ai

# 安装AI服务依赖
cd ai-service
pip install -r requirements.txt

# 启动AI服务
python app.py
```

默认情况下，AI服务将在 http://localhost:5000 上运行

## 6. 开发工具配置

### 6.1 推荐的IDE设置

**Visual Studio Code**:

1. 安装推荐扩展:

   - ESLint
   - Prettier
   - TypeScript Vue Plugin (Volar)
   - Docker
   - Python
   - Remote - Containers

2. 配置工作区设置:
   - 创建 `.vscode/settings.json`:
   ```json
   {
     "editor.formatOnSave": true,
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
     },
     "eslint.validate": ["javascript", "typescript", "vue"],
     "[javascript]": {
       "editor.defaultFormatter": "esbenp.prettier-vscode"
     },
     "[typescript]": {
       "editor.defaultFormatter": "esbenp.prettier-vscode"
     },
     "[vue]": {
       "editor.defaultFormatter": "esbenp.prettier-vscode"
     },
     "[python]": {
       "editor.formatOnSave": true,
       "editor.defaultFormatter": "ms-python.python"
     },
     "python.linting.enabled": true,
     "python.linting.pylintEnabled": true
   }
   ```

### 6.2 浏览器开发工具

1. **Chrome DevTools**:

   - 安装Vue.js devtools扩展: https://chrome.google.com/webstore/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd
   - 配置网络请求捕获和性能分析

2. **Firefox Developer Edition**(可选):
   - 安装Vue.js devtools扩展
   - 使用响应式设计模式测试不同设备尺寸

## 7. 本地测试

### 7.1 运行单元测试

```
# 前端单元测试
pnpm test:unit

# API单元测试
pnpm test:api
```

### 7.2 运行集成测试

```
# 确保所有服务都在运行
pnpm test:integration
```

### 7.3 代码检查

```
# 运行ESLint检查
pnpm lint

# 修复ESLint问题
pnpm lint:fix

# 检查代码格式
pnpm format:check

# 修复代码格式问题
pnpm format
```

## 8. 常见问题解决

### 8.1 Docker相关问题

1. **问题**: 容器无法启动或反复重启
   **解决方案**:

   - 检查日志: `docker-compose logs`
   - 检查端口冲突: `netstat -tuln`
   - 尝试完全重建: `docker-compose down -v && docker-compose up -d`

2. **问题**: 数据库连接失败
   **解决方案**:
   - 检查.env文件中的数据库配置
   - 确保数据库容器正在运行: `docker ps`
   - 检查数据库日志: `docker-compose logs db`

### 8.2 依赖相关问题

1. **问题**: 安装依赖时出错
   **解决方案**:

   - 清除pnpm缓存: `pnpm store prune`
   - 删除node_modules并重新安装: `rm -rf node_modules && pnpm install`

2. **问题**: 版本冲突
   **解决方案**:
   - 更新锁文件: `pnpm install --force`
   - 检查package.json中的依赖版本

### 8.3 API服务问题

1. **问题**: API服务启动失败
   **解决方案**:
   - 检查环境变量配置
   - 确认数据库迁移已运行
   - 检查日志输出识别具体错误

### 8.4 AI服务问题(可选)

1. **问题**: Python依赖安装失败
   **解决方案**:

   - 确保已安装Python开发工具: `sudo apt install python3-dev` (Ubuntu/Debian)
   - 尝试逐个安装问题依赖

2. **问题**: 模型加载失败
   **解决方案**:
   - 检查模型文件是否存在
   - 确认Python版本兼容性
   - 增加内存限制(如果适用)

## 9. 更新开发环境

### 9.1 更新代码库

```
# 拉取最新代码
git fetch origin
git pull origin develop

# 安装更新的依赖
pnpm install
```

### 9.2 更新数据库

```
# 运行最新的数据库迁移
pnpm db:migrate
```

### 9.3 更新Docker容器

```
# 更新并重建容器
docker-compose pull
docker-compose down
docker-compose up -d
```

## 10. 生产环境构建测试

```
# 构建前端生产版本
pnpm build

# 预览生产构建
pnpm preview
```

## 11. 团队协作工作流

### 11.1 分支策略

- `main`: 生产就绪代码
- `develop`: 开发主分支
- `feature/*`: 新功能分支
- `bugfix/*`: 问题修复分支
- `release/*`: 发布准备分支

### 11.2 代码提交流程

1. 创建功能分支:

   ```
   git checkout develop
   git pull
   git checkout -b feature/your-feature-name
   ```

2. 开发功能并提交:

   ```
   git add .
   git commit -m "feat: your feature description"
   ```

3. 推送分支并创建Pull Request:
   ```
   git push -u origin feature/your-feature-name
   ```
   然后在GitHub/GitLab上创建PR到develop分支

### 11.3 代码审查流程

1. 代码必须通过自动化测试
2. 至少需要一名团队成员审查并批准
3. 遵循约定式提交规范(Conventional Commits)

## 12. 结论

本文档提供了设置和使用AI驱动的产品碳足迹量化平台开发环境的完整指南。通过遵循这些步骤，开发人员可以快速配置一个功能完整的开发环境，并参与到项目开发中。

如有问题或需要更新，请联系技术团队或提交Issue到项目仓库。
