#!/bin/bash
echo "🚀 构建并启动 IPTV Player 生产环境..."

# 安装依赖
if [ ! -d "backend/node_modules" ]; then
    echo "📦 安装后端依赖..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 安装前端依赖..."
    cd frontend && npm install && cd ..
fi

# 构建前端
echo "🔨 构建前端..."
cd frontend && npm run build && cd ..

# 启动后端服务
echo "🚀 启动服务..."
export HOST=0.0.0.0
export PORT=3000
cd backend && node src/index.js
