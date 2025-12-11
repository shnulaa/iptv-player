const express = require('express');
const router = express.Router();
const proxyService = require('../services/proxyService');

// 代理获取M3U文件
router.get('/m3u', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ success: false, error: '缺少URL参数' });
    }
    
    const content = await proxyService.fetchM3U(url);
    res.type('text/plain').send(content);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 代理HLS流 - m3u8
router.get('/hls', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ success: false, error: '缺少URL参数' });
    }
    
    // 获取请求的基础URL用于构建代理链接
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const baseUrl = `${protocol}://${host}`;
    
    const content = await proxyService.proxyM3U8(url, baseUrl);
    
    res.set({
      'Content-Type': 'application/vnd.apple.mpegurl',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    });
    res.send(content);
  } catch (error) {
    console.error('HLS proxy error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 代理流内容 (ts文件, key文件等)
router.get('/stream', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ success: false, error: '缺少URL参数' });
    }
    
    const result = await proxyService.proxyStream(url);
    
    res.set({
      'Content-Type': result.contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    });
    res.send(Buffer.from(result.data));
  } catch (error) {
    console.error('Stream proxy error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
