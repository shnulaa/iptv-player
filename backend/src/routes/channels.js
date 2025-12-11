const express = require('express');
const router = express.Router();
const channelService = require('../services/channelService');
const proxyService = require('../services/proxyService');

// 获取所有频道
router.get('/', (req, res) => {
  try {
    const { query, group, status } = req.query;
    const channels = channelService.searchChannels({ query, group, status });
    res.json({ success: true, data: channels });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取统计信息
router.get('/stats', (req, res) => {
  try {
    const stats = channelService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取所有分组
router.get('/groups', (req, res) => {
  try {
    const groups = channelService.getAllGroups();
    res.json({ success: true, data: groups });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取单个频道
router.get('/:id', (req, res) => {
  try {
    const channel = channelService.getChannelById(req.params.id);
    if (!channel) {
      return res.status(404).json({ success: false, error: '频道不存在' });
    }
    res.json({ success: true, data: channel });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 添加单个频道
router.post('/', (req, res) => {
  try {
    const channel = channelService.addChannel(req.body);
    res.json({ success: true, data: channel });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 批量导入频道
router.post('/import', (req, res) => {
  try {
    const { channels } = req.body;
    const result = channelService.addChannels(channels);
    res.json({ success: true, data: result, count: channels.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新频道
router.put('/:id', (req, res) => {
  try {
    const channel = channelService.updateChannel(req.params.id, req.body);
    res.json({ success: true, data: channel });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 删除频道
router.delete('/:id', (req, res) => {
  try {
    channelService.deleteChannel(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 清空所有频道
router.delete('/', (req, res) => {
  try {
    channelService.clearAllChannels();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 测试单个频道
router.post('/:id/test', async (req, res) => {
  try {
    const channel = channelService.getChannelById(req.params.id);
    if (!channel) {
      return res.status(404).json({ success: false, error: '频道不存在' });
    }
    
    const result = await proxyService.testChannel(channel.url);
    const status = result.success ? 'online' : 'offline';
    
    channelService.updateChannel(req.params.id, {
      status,
      responseTime: result.responseTime,
      lastTested: Date.now(),
    });
    
    res.json({ success: true, data: { ...result, status } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 批量测试频道
router.post('/test-batch', async (req, res) => {
  try {
    const { channelIds } = req.body;
    const results = [];
    
    for (const id of channelIds) {
      const channel = channelService.getChannelById(id);
      if (channel) {
        const result = await proxyService.testChannel(channel.url);
        const status = result.success ? 'online' : 'offline';
        
        channelService.updateChannel(id, {
          status,
          responseTime: result.responseTime,
          lastTested: Date.now(),
        });
        
        results.push({ id, ...result, status });
      }
    }
    
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
