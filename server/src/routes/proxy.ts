import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';

const router = Router();

// 代理流媒体请求
router.get('/stream', async (req: Request, res: Response) => {
  try {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    const decodedUrl = decodeURIComponent(url);
    console.log('Proxying stream:', decodedUrl);

    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': new URL(decodedUrl).origin,
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        success: false, 
        error: `Upstream error: ${response.status}` 
      });
    }

    // 设置响应头
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');

    // 流式传输
    if (response.body) {
      response.body.pipe(res);
    } else {
      const buffer = await response.buffer();
      res.send(buffer);
    }
  } catch (error: any) {
    console.error('Stream proxy error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 代理M3U8文件并重写内部URL
router.get('/m3u8', async (req: Request, res: Response) => {
  try {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    const decodedUrl = decodeURIComponent(url);
    const baseUrl = decodedUrl.substring(0, decodedUrl.lastIndexOf('/') + 1);
    
    console.log('Proxying M3U8:', decodedUrl);

    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Referer': new URL(decodedUrl).origin,
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        success: false, 
        error: `Upstream error: ${response.status}` 
      });
    }

    let content = await response.text();
    
    // 重写相对路径为绝对路径并通过代理
    content = content.split('\n').map(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        let absoluteUrl: string;
        if (line.startsWith('http://') || line.startsWith('https://')) {
          absoluteUrl = line;
        } else {
          absoluteUrl = baseUrl + line;
        }
        // 如果是ts分片，通过stream代理；如果是m3u8，通过m3u8代理
        if (line.endsWith('.m3u8')) {
          return `/api/proxy/m3u8?url=${encodeURIComponent(absoluteUrl)}`;
        } else {
          return `/api/proxy/stream?url=${encodeURIComponent(absoluteUrl)}`;
        }
      }
      return line;
    }).join('\n');

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(content);
  } catch (error: any) {
    console.error('M3U8 proxy error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 测试频道是否可用
router.get('/test', async (req: Request, res: Response) => {
  try {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    const decodedUrl = decodeURIComponent(url);
    const startTime = Date.now();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(decodedUrl, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: controller.signal as any,
      });

      clearTimeout(timeout);
      
      const responseTime = Date.now() - startTime;
      
      res.json({
        success: true,
        data: {
          online: response.ok || response.status === 405, // 有些服务器不支持HEAD
          responseTime,
          status: response.status,
        },
      });
    } catch (fetchError: any) {
      clearTimeout(timeout);
      
      // 如果HEAD失败，尝试GET少量数据
      try {
        const getResponse = await fetch(decodedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Range': 'bytes=0-1024',
          },
        });
        
        const responseTime = Date.now() - startTime;
        
        res.json({
          success: true,
          data: {
            online: getResponse.ok || getResponse.status === 206,
            responseTime,
            status: getResponse.status,
          },
        });
      } catch {
        res.json({
          success: true,
          data: {
            online: false,
            error: fetchError.message,
          },
        });
      }
    }
  } catch (error: any) {
    res.json({
      success: true,
      data: {
        online: false,
        error: error.message,
      },
    });
  }
});

export default router;
