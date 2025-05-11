#!/bin/bash

# 设置错误时退出
set -e

echo "===== 开始创建数据库表 ====="

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 切换到项目根目录
cd "$PROJECT_ROOT"

# 检查是否安装了 Node.js
if ! command -v node &> /dev/null; then
    echo "错误: 没有找到 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查是否安装了 @supabase/supabase-js
if ! grep -q '"@supabase/supabase-js"' package.json; then
    echo "安装 @supabase/supabase-js..."
    npm install @supabase/supabase-js
fi

# 执行创建表的脚本
echo "创建供应商表..."
node --experimental-modules "$SCRIPT_DIR/create-vendors-table.mjs"

echo "===== 数据库表创建完成 =====" 