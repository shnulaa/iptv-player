#!/bin/bash
echo "🚀 启动 IPTV Player 开发环境..."
echo ""

# 检查依赖是否安装
if [ ! -d "backend/node_modules" ] || [ ! -d "frontend/node_modules" ]; then
    echo "📦 首次运行，安装依赖..."
    cd backend && npm install && cd ..
    cd frontend && npm install && cd ..
    npm install
fi

echo "🔧 启动后端服务 (端口 3001)..."
cd backend && npm start &
BACKEND_PID=$!

sleep 2

echo "🎨 启动前端服务 (端口 3000)..."
cd frontend && BROWSER=none npm start &
FRONTEND_PID=$!

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              IPTV Player v3.0 已启动                       ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  🌐 前端: http://localhost:3000                            ║"
echo "║  📡 后端: http://localhost:3001/api                        ║"
echo "║                                                            ║"
echo "║  💡 提示: WSL/Docker 用户请使用本机IP访问                  ║"
echo "║     例如: http://172.27.115.228:3000                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "按 Ctrl+C 停止服务..."

wait $BACKEND_PID $FRONTEND_PID
