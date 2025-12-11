const express = require('express');
const router = express.Router();
const channelService = require('../services/channelService');
const proxyService = require('../services/proxyService');

// 获取所有频道
router.get('/', (req, res) => {
  try {
    const { query, group, status } = req.query;
    console.log('[Channels] Get channels, query:', query, 'group:', group, 'status:', status);
    const channels = channelService.searchChannels({ query, group, status });
    console.log('[Channels] Found channels:', channels.length);
    res.json({ success: true, data: channels });
  } catch (error) {
    console.error('[Channels] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取统计信息
router.get('/stats', (req, res) => {
  try {
    const stats = channelService.getStats();
    console.log('[Channels] Stats:', stats);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('[Channels] Stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取所有分组
router.get('/groups', (req, res) => {
  try {
    const groups = channelService.getAllGroups();
    console.log('[Channels] Groups:', groups);
    res.json({ success: true, data: groups });
  } catch (error) {
    console.error('[Channels] Groups error:', error);
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
    console.log('[Channels] Add channel:', req.body);
    const channel = channelService.addChannel(req.body);
    res.json({ success: true, data: channel });
  } catch (error) {
    console.error('[Channels] Add error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 批量导入频道
router.post('/import', (req, res) => {
  try {
    const { channels } = req.body;
    console.log('[Channels] Import channels:', channels?.length);
    
    if (!channels || !Array.isArray(channels)) {
      return res.status(400).json({ success: false, error: '无效的频道数据' });
    }

    const result = channelService.addChannels(channels);
    console.log('[Channels] Import result:', result);
    res.json({ success: true, data: result, count: channels.length });
  } catch (error) {
    console.error('[Channels] Import error:', error);
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

    console.log('[Channels] Testing channel:', channel.id, channel.name, channel.url);
    const result = await proxyService.testChannel(channel.url);
    const status = result.success ? 'online' : 'offline';

    console.log('[Channels] Test result:', result);

    // 更新频道状态
    channelService.updateChannel(req.params.id, {
      status,
      response_time: result.responseTime,
      last_tested: Date.now(),
    });

    res.json({ 
      success: true, 
      data: { 
        ...result, 
        status,
        id: channel.id,
      } 
    });
  } catch (error) {
    console.error('[Channels] Test error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 批量测试频道
router.post('/test-batch', async (req, res) => {
  try {
    const { channelIds } = req.body;
    console.log('[Channels] Batch test, count:', channelIds?.length);
    
    if (!channelIds || !Array.isArray(channelIds)) {
      return res.status(400).json({ success: false, error: '无效的频道ID列表' });
    }

    const results = [];

    for (const id of channelIds) {
      const channel = channelService.getChannelById(id);
      if (channel) {
        console.log('[Channels] Testing:', channel.name);
        const result = await proxyService.testChannel(channel.url);
        const status = result.success ? 'online' : 'offline';

        channelService.updateChannel(id, {
          status,
          response_time: result.responseTime,
          last_tested: Date.now(),
        });

        results.push({ 
          id, 
          success: result.success,
          responseTime: result.responseTime,
          status,
          error: result.error,
        });
      }
    }

    console.log('[Channels] Batch test complete:', results.length);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('[Channels] Batch test error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
