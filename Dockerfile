FROM node:18-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
COPY .npmrc ./
COPY backend/.npmrc ./backend/
COPY frontend/.npmrc ./frontend/

RUN cd backend && npm install --production
RUN cd frontend && npm install

# 复制源码
COPY . .

# 构建前端
RUN cd frontend && npm run build

# 暴露端口
EXPOSE 3000

# 启动
ENV HOST=0.0.0.0
ENV PORT=3000
CMD ["npm", "run", "start:docker"]
