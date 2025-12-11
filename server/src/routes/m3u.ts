import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { channelDb, historyDb } from '../db';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// 解析M3U内容
function parseM3U(content: string) {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  const channels: any[] = [];
  const groupsSet = new Set<string>();
  
  let currentChannel: any = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('#EXTINF:')) {
      const extinf = line.substring(8);
      
      const tvgIdMatch = extinf.match(/tvg-id="([^"]*)"/);
      const tvgNameMatch = extinf.match(/tvg-name="([^"]*)"/);
      const tvgLogoMatch = extinf.match(/tvg-logo="([^"]*)"/);
      const groupMatch = extinf.match(/group-title="([^"]*)"/);
      
      const nameMatch = extinf.match(/,(.+)$/);
      const name = nameMatch ? nameMatch[1].trim() : 'Unknown';
      
      const group = groupMatch ? groupMatch[1] : '未分类';
      groupsSet.add(group);
      
      currentChannel = {
        name,
        tvg_id: tvgIdMatch ? tvgIdMatch[1] : undefined,
        tvg_name: tvgNameMatch ? tvgNameMatch[1] : undefined,
        logo: tvgLogoMatch ? tvgLogoMatch[1] : undefined,
        group_name: group,
        status: 'unknown',
      };
    } else if (line.startsWith('#EXTGRP:')) {
      if (currentChannel) {
        const group = line.substring(8).trim();
        currentChannel.group_name = group;
        groupsSet.add(group);
      }
    } else if (!line.startsWith('#') && line.length > 0) {
      if (currentChannel) {
        currentChannel.url = line;
        channels.push(currentChannel);
        currentChannel = null;
      }
    }
  }
  
  return { channels, groups: Array.from(groupsSet).sort() };
}

// 从URL加载M3U
router.post('/url', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    console.log('Fetching M3U from:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 30000,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const content = await response.text();
    
    if (!content.includes('#EXTINF') && !content.includes('#EXTM3U')) {
      return res.status(400).json({ success: false, error: 'Invalid M3U content' });
    }

    const { channels, groups } = parseM3U(content);

    // 清除旧数据并插入新数据
    channelDb.deleteAll();
    const channelsWithId = channels.map(ch => ({ ...ch, id: uuidv4() }));
    channelDb.insertMany(channelsWithId);

    // 保存导入历史
    historyDb.insert({
      id: uuidv4(),
      name: new URL(url).hostname,
      url,
      channel_count: channels.length,
      type: 'url',
      created_at: Date.now(),
    });

    res.json({ 
      success: true, 
      data: { 
        count: channels.length, 
        groups,
      } 
    });
  } catch (error: any) {
    console.error('M3U URL fetch error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch M3U' 
    });
  }
});

// 上传M3U文件
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const content = req.file.buffer.toString('utf-8');
    
    if (!content.includes('#EXTINF') && !content.includes('#EXTM3U')) {
      return res.status(400).json({ success: false, error: 'Invalid M3U content' });
    }

    const { channels, groups } = parseM3U(content);

    // 清除旧数据并插入新数据
    channelDb.deleteAll();
    const channelsWithId = channels.map(ch => ({ ...ch, id: uuidv4() }));
    channelDb.insertMany(channelsWithId);

    // 保存导入历史
    historyDb.insert({
      id: uuidv4(),
      name: req.file.originalname,
      channel_count: channels.length,
      type: 'file',
      created_at: Date.now(),
    });

    res.json({ 
      success: true, 
      data: { 
        count: channels.length, 
        groups,
      } 
    });
  } catch (error: any) {
    console.error('M3U upload error:', error);
    res.status(500).json({ success: false, error: 'Failed to parse M3U file' });
  }
});

// 直接解析M3U文本
router.post('/text', async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    if (!content.includes('#EXTINF') && !content.includes('#EXTM3U')) {
      return res.status(400).json({ success: false, error: 'Invalid M3U content' });
    }

    const { channels, groups } = parseM3U(content);

    // 清除旧数据并插入新数据
    channelDb.deleteAll();
    const channelsWithId = channels.map(ch => ({ ...ch, id: uuidv4() }));
    channelDb.insertMany(channelsWithId);

    // 保存导入历史
    historyDb.insert({
      id: uuidv4(),
      name: '粘贴内容',
      channel_count: channels.length,
      type: 'text',
      created_at: Date.now(),
    });

    res.json({ 
      success: true, 
      data: { 
        count: channels.length, 
        groups,
      } 
    });
  } catch (error: any) {
    console.error('M3U text parse error:', error);
    res.status(500).json({ success: false, error: 'Failed to parse M3U content' });
  }
});

// 导出M3U
router.get('/export', (req: Request, res: Response) => {
  try {
    const channels = channelDb.getAll();
    
    let content = '#EXTM3U\n';
    for (const channel of channels) {
      let extinf = '#EXTINF:-1';
      if (channel.tvg_id) extinf += ` tvg-id="${channel.tvg_id}"`;
      if (channel.tvg_name) extinf += ` tvg-name="${channel.tvg_name}"`;
      if (channel.logo) extinf += ` tvg-logo="${channel.logo}"`;
      if (channel.group_name) extinf += ` group-title="${channel.group_name}"`;
      extinf += `,${channel.name}`;
      content += extinf + '\n' + channel.url + '\n';
    }

    res.setHeader('Content-Type', 'application/x-mpegurl');
    res.setHeader('Content-Disposition', 'attachment; filename=playlist.m3u');
    res.send(content);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to export M3U' });
  }
});

// 获取导入历史
router.get('/history', (req: Request, res: Response) => {
  try {
    const histories = historyDb.getAll();
    res.json({ success: true, data: histories });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get history' });
  }
});

// 删除导入历史
router.delete('/history/:id', (req: Request, res: Response) => {
  try {
    historyDb.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete history' });
  }
});

// 清除所有历史
router.delete('/history', (req: Request, res: Response) => {
  try {
    historyDb.deleteAll();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to clear history' });
  }
});

export default router;
