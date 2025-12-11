const axios = require('axios');
const { URL } = require('url');

class ProxyService {
  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
  }

  // 获取M3U内容
  async fetchM3U(url) {
    try {
      const response = await this.axiosInstance.get(url, {
        responseType: 'text',
        headers: {
          'Accept': '*/*',
        },
      });
      return response.data;
    } catch (error) {
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
              return `URI="${baseUrl}/api/proxy/stream?url=${encodeURIComponent(fullUrl)}"`;
            });
          }
          return line;
        }
        
        // 处理TS文件或子m3u8链接
        const fullUrl = this.resolveUrl(line, streamBaseUrl, url);
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

  // 测试频道
  async testChannel(url) {
    const startTime = Date.now();
    try {
      const response = await this.axiosInstance.head(url, {
        timeout: 10000,
      });
      
      if (response.status >= 200 && response.status < 400) {
        return {
          success: true,
          responseTime: Date.now() - startTime,
        };
      }
      return { success: false, error: `HTTP ${response.status}` };
    } catch (error) {
      // 如果HEAD请求失败，尝试GET请求
      try {
        const response = await this.axiosInstance.get(url, {
          timeout: 10000,
          responseType: 'stream',
        });
        response.data.destroy(); // 立即关闭流
        return {
          success: true,
          responseTime: Date.now() - startTime,
        };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
  }
}

module.exports = new ProxyService();
