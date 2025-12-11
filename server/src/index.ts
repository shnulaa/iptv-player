import express from 'express';
import cors from 'cors';
import path from 'path';
import channelsRouter from './routes/channels';
import m3uRouter from './routes/m3u';
import proxyRouter from './routes/proxy';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API路由
app.use('/api/channels', channelsRouter);
app.use('/api/m3u', m3uRouter);
app.use('/api/proxy', proxyRouter);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// 生产环境下服务静态文件
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/build/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 IPTV Server running on http://localhost:${PORT}`);
  console.log(`📺 API available at http://localhost:${PORT}/api`);
});
