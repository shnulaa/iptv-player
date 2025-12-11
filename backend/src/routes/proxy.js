const express = require('express');
const router = express.Router();
const proxyService = require('../services/proxyService');

// CORS 预检请求处理
router.options('*', (_, res) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Range',
    'Access-Control-Max-Age': '86400',
  });
  res.status(200).end();
});

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
    // 自动检测协议：优先使用 HTTPS 以避免混合内容问题
    let protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');

    // 如果原请求是 HTTPS 或通过代理转发 HTTPS，强制使用 HTTPS
    if (req.secure ||
        req.headers['x-forwarded-proto'] === 'https' ||
        req.headers['x-forwarded-ssl'] === 'on' ||
        req.headers['x-forwarded-https'] === 'on') {
      protocol = 'https';
    }

    const baseUrl = `${protocol}://${host}`;

    console.log('[Proxy Route] HLS proxy request:', { originalUrl: url, baseUrl, host, protocol });

    const content = await proxyService.proxyM3U8(url, baseUrl);

    res.set({
      'Content-Type': 'application/vnd.apple.mpegurl',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
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
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Accept-Ranges': 'bytes',
    });
    res.send(Buffer.from(result.data));
  } catch (error) {
    console.error('Stream proxy error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
