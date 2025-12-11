const express = require('express');
const cors = require('cors');
const path = require('path');

const channelsRouter = require('./routes/channels');
const proxyRouter = require('./routes/proxy');
const historyRouter = require('./routes/history');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// 中间件
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API路由
app.use('/api/channels', channelsRouter);
app.use('/api/proxy', proxyRouter);
app.use('/api/history', historyRouter);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 静态文件服务 (生产环境)
app.use(express.static(path.join(__dirname, '../../frontend/build')));

// SPA 回退
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, error: err.message });
});

app.listen(PORT, HOST, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                    IPTV Player Backend                     ║
╠════════════════════════════════════════════════════════════╣
║  🚀 Server running at http://${HOST}:${PORT}                  ║
║  📡 API: http://${HOST}:${PORT}/api                           ║
║  💾 Database: SQLite (./data/iptv.db)                      ║
╚════════════════════════════════════════════════════════════╝
  `);
});
