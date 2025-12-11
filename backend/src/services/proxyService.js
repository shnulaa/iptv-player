const axios = require('axios');
const { URL } = require('url');

class ProxyService {
  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000,
      maxRedirects: 5,
      validateStatus: (status) => status < 500, // 接受所有非5xx响应
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
  }

  // 获取M3U内容
  async fetchM3U(url) {
    try {
      console.log('[ProxyService] Fetching M3U:', url);
      const response = await this.axiosInstance.get(url, {
        responseType: 'text',
        timeout: 15000,
        headers: {
          'Accept': '*/*',
        },
      });
      console.log('[ProxyService] M3U fetched, length:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('[ProxyService] Fetch M3U error:', error.message);
      throw new Error(`获取M3U失败: ${error.message}`);
    }
  }

  // 代理HLS流 - 获取m3u8
  async proxyM3U8(url, baseUrl) {
    try {
      const response = await this.axiosInstance.get(url, {
        responseType: 'text',
      });

      let content = response.data;
      const urlObj = new URL(url);
      const streamBaseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1)}`;

      // 处理m3u8内容，将相对路径转换为代理路径
      const lines = content.split('\n');
      const processedLines = lines.map(line => {
        line = line.trim();

        // 跳过注释和空行
        if (line.startsWith('#') || line === '') {
          // 处理 #EXT-X-KEY 等包含URI的行
          if (line.includes('URI="')) {
            line = line.replace(/URI="([^"]+)"/g, (match, uri) => {
              const fullUrl = this.resolveUrl(uri, streamBaseUrl, url);
              const protocol = window.location.protocol;
              const host = window.location.host;
              const baseUrl = `${protocol}//${host}`;
              return `URI="${baseUrl}/api/proxy/stream?url=${encodeURIComponent(fullUrl)}"`;
            });
          }
          return line;
        }

        // 处理TS文件或子m3u8链接
        const fullUrl = this.resolveUrl(line, streamBaseUrl, url);
        const protocol = window.location.protocol;
        const host = window.location.host;
        const baseUrl = `${protocol}//${host}`;
        return `${baseUrl}/api/proxy/stream?url=${encodeURIComponent(fullUrl)}`;
      });

      return processedLines.join('\n');
    } catch (error) {
      throw new Error(`代理M3U8失败: ${error.message}`);
    }
  }

  // 代理TS片段或其他资源
  async proxyStream(url) {
    try {
      const response = await this.axiosInstance.get(url, {
        responseType: 'arraybuffer',
        headers: {
          'Accept': '*/*',
        },
      });

      return {
        data: response.data,
        contentType: response.headers['content-type'] || 'video/mp2t',
      };
    } catch (error) {
      throw new Error(`代理流失败: ${error.message}`);
    }
  }

  // 解析URL
  resolveUrl(path, streamBaseUrl, originalUrl) {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    if (path.startsWith('/')) {
      const urlObj = new URL(originalUrl);
      return `${urlObj.protocol}//${urlObj.host}${path}`;
    }

    return streamBaseUrl + path;
  }

  // 测试频道 - 增强版
  async testChannel(url) {
    const startTime = Date.now();
    console.log('[ProxyService] Testing channel:', url);
    
    try {
      // 首先尝试 HEAD 请求（更快）
      try {
        const response = await axios.head(url, {
          timeout: 8000,
          maxRedirects: 3,
          validateStatus: (status) => status < 500,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        const responseTime = Date.now() - startTime;
        console.log('[ProxyService] HEAD success:', response.status, 'time:', responseTime);
        
        if (response.status >= 200 && response.status < 400) {
          return {
            success: true,
            responseTime,
            message: `HTTP ${response.status}`,
          };
        }
      } catch (headError) {
        console.log('[ProxyService] HEAD failed, trying GET:', headError.message);
      }

      // HEAD 失败，尝试 GET 请求（获取少量数据）
      const response = await axios.get(url, {
        timeout: 10000,
        maxRedirects: 3,
        responseType: 'stream',
        validateStatus: (status) => status < 500,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Range': 'bytes=0-1024', // 只获取前1KB
        },
      });

      const responseTime = Date.now() - startTime;
      
      // 立即销毁流
      if (response.data && typeof response.data.destroy === 'function') {
        response.data.destroy();
      }

      console.log('[ProxyService] GET success:', response.status, 'time:', responseTime);

      if (response.status >= 200 && response.status < 400) {
        return {
          success: true,
          responseTime,
          message: `HTTP ${response.status}`,
        };
      }

      return {
        success: false,
        responseTime,
        error: `HTTP ${response.status}`,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('[ProxyService] Test failed:', error.message);
      
      let errorMessage = error.message;
      if (error.code === 'ECONNABORTED') {
        errorMessage = '连接超时';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = '域名无法解析';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = '连接被拒绝';
      }

      return {
        success: false,
        responseTime,
        error: errorMessage,
      };
    }
  }

  // 批量测试频道
  async testChannels(channels) {
    const results = [];
    for (const channel of channels) {
      const result = await this.testChannel(channel.url);
      results.push({
        id: channel.id,
        ...result,
        status: result.success ? 'online' : 'offline',
      });
    }
    return results;
  }
}

module.exports = new ProxyService();
