# Climate Seal Data Processing Scripts

这个项目包含两个主要脚本用于处理和管理 Elasticsearch 数据：

## 环境要求

- Python 3.8+
- pip 包管理器
- CUDA（可选，用于GPU加速）
- 至少 8GB RAM
- 磁盘空间 > 10GB（用于模型下载）

## 安装依赖

1. 创建并激活虚拟环境（推荐）：

```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

2. 安装依赖包：

```bash
# 更新 pip
python -m pip install --upgrade pip

# 安装依赖（建议按顺序安装）
pip install torch torchvision torchaudio
pip install transformers
pip install sentence-transformers
pip install -r requirements.txt
```

3. 环境变量配置：

```bash
# Windows PowerShell
$env:TRANSFORMERS_CACHE = "C:\Users\YourUsername\.cache\huggingface"
$env:TORCH_HOME = "C:\Users\YourUsername\.cache\torch"

# Windows CMD
set TRANSFORMERS_CACHE=C:\Users\YourUsername\.cache\huggingface
set TORCH_HOME=C:\Users\YourUsername\.cache\torch

# Linux/Mac
export TRANSFORMERS_CACHE=~/.cache/huggingface
export TORCH_HOME=~/.cache/torch
```

4. CUDA 相关配置（可选）：

如果需要使用 GPU 加速，请确保：
- 已安装 NVIDIA GPU 驱动
- 已安装 CUDA Toolkit
- 设置 CUDA_PATH 环境变量：
  ```bash
  # Windows
  set CUDA_PATH=C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.x
  
  # Linux/Mac
  export CUDA_PATH=/usr/local/cuda
  ```

## 脚本说明

### 1. excel_to_es.py

这个脚本用于将 Excel/CSV 数据导入到 Elasticsearch。主要功能包括：

- 读取 Excel/CSV 文件
- 使用 sentence-transformers 生成文本向量
- 批量上传数据到 Elasticsearch
- 自动创建索引和映射

使用方法：
```python
python excel_to_es.py
```

配置说明：
```python
ES_ENDPOINT = "your_elasticsearch_endpoint"
INDEX_NAME = "your_index_name"
EXCEL_PATH = "path_to_your_excel.xlsx"
USERNAME = "your_username"
PASSWORD = "your_password"
```

### 2. delete_index.py

这个脚本用于删除 Elasticsearch 中的索引。

使用方法：
```python
python delete_index.py
```

## 注意事项

1. 确保已正确配置 Elasticsearch 连接信息
2. 运行脚本前请确认数据文件路径正确
3. 删除索引操作不可逆，请谨慎使用 delete_index.py

## 故障排除指南

### 1. Transformers 相关错误

如果遇到 "Failed to import transformers.modeling_utils" 错误：

a) 环境变量问题：
```bash
错误：expected str, bytes or os.PathLike object, not NoneType
解决：设置必要的环境变量（见上方环境变量配置部分）
```

b) 缓存问题：
```bash
# 清理并重新下载模型
rm -rf ~/.cache/huggingface  # Linux/Mac
rd /s /q %USERPROFILE%\.cache\huggingface  # Windows

# 重新安装库
pip uninstall transformers sentence-transformers
pip install transformers sentence-transformers
```

c) 版本兼容性：
```bash
# 安装特定版本
pip install transformers==4.30.0
pip install sentence-transformers==2.2.2
```

### 2. CUDA 相关错误

如果遇到 CUDA 相关错误，脚本会自动切换到 CPU 模式运行。常见问题解决方案：

a) CUDA_PATH 未设置：
```bash
错误：expected str, bytes or os.PathLike object, not NoneType
解决：设置 CUDA_PATH 环境变量
```

b) GPU 内存不足：
```python
# 在代码中添加：
torch.cuda.empty_cache()
```

### 3. 依赖项安装问题

如果安装依赖时遇到问题：

a) 版本冲突：
```bash
pip install --upgrade pip
pip install -r requirements.txt --no-cache-dir
```

b) 特定包安装失败：
```bash
# 尝试单独安装问题包
pip install package_name --no-deps
```

### 4. 常见问题

1. 模型下载失败
   - 检查网络连接
   - 确保有足够的磁盘空间
   - 尝试使用代理或镜像源

2. 内存不足
   - 关闭其他占用内存的程序
   - 使用更小的批处理大小
   - 考虑使用 CPU 模式运行

3. 权限问题
   - Windows：以管理员身份运行命令提示符
   - Linux/Mac：使用 sudo 或检查目录权限

## 许可证

MIT License

## 联系方式

如有问题请联系技术支持：
- Email: support@example.com
- 项目主页: https://github.com/your-repo
