import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { channelDb } from '../db';
import { Channel } from '../types';

const router = Router();

// 获取所有频道
router.get('/', (req: Request, res: Response) => {
  try {
    const { search, group, status } = req.query;
    
    let channels: Channel[];
    if (search || group || status) {
      channels = channelDb.search(
        search as string || '',
        group as string,
        status as string
      );
    } else {
      channels = channelDb.getAll();
    }
    
    res.json({ success: true, data: channels });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get channels' });
  }
});

// 获取统计信息
router.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = channelDb.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

// 获取所有分组
router.get('/groups', (req: Request, res: Response) => {
  try {
    const groups = channelDb.getGroups();
    res.json({ success: true, data: ['全部', ...groups] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get groups' });
  }
});

// 获取单个频道
router.get('/:id', (req: Request, res: Response) => {
  try {
    const channel = channelDb.getById(req.params.id);
    if (!channel) {
      return res.status(404).json({ success: false, error: 'Channel not found' });
    }
    res.json({ success: true, data: channel });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get channel' });
  }
});

// 创建频道
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, url, logo, group_name, tvg_id, tvg_name } = req.body;
    
    if (!name || !url) {
      return res.status(400).json({ success: false, error: 'Name and URL are required' });
    }

    const channel = channelDb.insert({
      id: uuidv4(),
      name,
      url,
      logo,
      group_name: group_name || '未分类',
      status: 'unknown',
      tvg_id,
      tvg_name,
    });

    res.status(201).json({ success: true, data: channel });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create channel' });
  }
});

// 批量创建频道
router.post('/batch', (req: Request, res: Response) => {
  try {
    const { channels } = req.body;
    
    if (!Array.isArray(channels)) {
      return res.status(400).json({ success: false, error: 'Channels must be an array' });
    }

    const channelsWithId = channels.map(ch => ({
      ...ch,
      id: uuidv4(),
      status: 'unknown' as const,
    }));

    channelDb.insertMany(channelsWithId);

    res.status(201).json({ success: true, data: { count: channelsWithId.length } });
  } catch (error) {
    console.error('Batch insert error:', error);
    res.status(500).json({ success: false, error: 'Failed to create channels' });
  }
});

// 更新频道
router.put('/:id', (req: Request, res: Response) => {
  try {
    const success = channelDb.update(req.params.id, req.body);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Channel not found' });
    }
    
    const channel = channelDb.getById(req.params.id);
    res.json({ success: true, data: channel });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update channel' });
  }
});

// 更新频道状态
router.patch('/:id/status', (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const success = channelDb.updateStatus(req.params.id, status);
    
    if (!success) {
      return res.status(404).json({ success: false, error: 'Channel not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
});

// 删除频道
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const success = channelDb.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Channel not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete channel' });
  }
});

// 删除所有频道
router.delete('/', (req: Request, res: Response) => {
  try {
    channelDb.deleteAll();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete all channels' });
  }
});

export default router;
