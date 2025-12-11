const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');

class ChannelService {
  // 获取所有频道
  getAllChannels() {
    return db.prepare('SELECT * FROM channels ORDER BY group_title, name').all();
  }

  // 获取所有分组
  getAllGroups() {
    const rows = db.prepare('SELECT DISTINCT group_title FROM channels WHERE group_title IS NOT NULL ORDER BY group_title').all();
    const groups = rows.map(r => r.group_title).filter(g => g && g.trim());
    return ['全部', ...groups];
  }

  // 根据条件查询频道
  searchChannels({ query, group, status }) {
    let sql = 'SELECT * FROM channels WHERE 1=1';
    const params = {};

    if (query) {
      sql += ' AND name LIKE @query';
      params.query = `%${query}%`;
    }

    if (group && group !== '全部') {
      sql += ' AND group_title = @group';
      params.group = group;
    }

    if (status && status !== 'all') {
      sql += ' AND status = @status';
      params.status = status;
    }

    sql += ' ORDER BY group_title, name';
    return db.prepare(sql).all(params);
  }

  // 添加频道 - 修复: 同时支持 group 和 group_title
  addChannel(channel) {
    const id = channel.id || uuidv4();
    const groupTitle = channel.group_title || channel.group || '未分类';
    
    const stmt = db.prepare(`
      INSERT INTO channels (id, name, url, logo, group_title, tvg_id, tvg_name, status)
      VALUES (@id, @name, @url, @logo, @group_title, @tvg_id, @tvg_name, @status)
    `);

    stmt.run({
      id,
      name: channel.name,
      url: channel.url,
      logo: channel.logo || null,
      group_title: groupTitle,
      tvg_id: channel.tvg_id || channel.tvgId || null,
      tvg_name: channel.tvg_name || channel.tvgName || null,
      status: channel.status || 'unknown',
    });

    return this.getChannelById(id);
  }

  // 批量添加频道 - 修复: 同时支持 group 和 group_title
  addChannels(channels) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO channels (id, name, url, logo, group_title, tvg_id, tvg_name, status)
      VALUES (@id, @name, @url, @logo, @group_title, @tvg_id, @tvg_name, @status)
    `);

    const insertMany = db.transaction((channels) => {
      for (const channel of channels) {
        const groupTitle = channel.group_title || channel.group || '未分类';
        stmt.run({
          id: channel.id || uuidv4(),
          name: channel.name,
          url: channel.url,
          logo: channel.logo || null,
          group_title: groupTitle,
          tvg_id: channel.tvg_id || channel.tvgId || null,
          tvg_name: channel.tvg_name || channel.tvgName || null,
          status: channel.status || 'unknown',
        });
      }
    });

    insertMany(channels);
    return { count: channels.length };
  }

  // 更新频道
  updateChannel(id, updates) {
    const fields = [];
    const params = { id };

    if (updates.name !== undefined) {
      fields.push('name = @name');
      params.name = updates.name;
    }
    if (updates.url !== undefined) {
      fields.push('url = @url');
      params.url = updates.url;
    }
    if (updates.logo !== undefined) {
      fields.push('logo = @logo');
      params.logo = updates.logo;
    }
    if (updates.group !== undefined || updates.group_title !== undefined) {
      fields.push('group_title = @group_title');
      params.group_title = updates.group_title || updates.group;
    }
    if (updates.status !== undefined) {
      fields.push('status = @status');
      params.status = updates.status;
    }
    if (updates.responseTime !== undefined || updates.response_time !== undefined) {
      fields.push('response_time = @response_time');
      params.response_time = updates.responseTime || updates.response_time;
    }
    if (updates.lastTested !== undefined || updates.last_tested !== undefined) {
      fields.push('last_tested = @last_tested');
      params.last_tested = updates.lastTested || updates.last_tested;
    }

    if (fields.length === 0) {
      return this.getChannelById(id);
    }

    fields.push('updated_at = strftime("%s", "now")');

    const sql = `UPDATE channels SET ${fields.join(', ')} WHERE id = @id`;
    db.prepare(sql).run(params);

    return this.getChannelById(id);
  }

  // 获取单个频道
  getChannelById(id) {
    return db.prepare('SELECT * FROM channels WHERE id = ?').get(id);
  }

  // 删除频道
  deleteChannel(id) {
    db.prepare('DELETE FROM channels WHERE id = ?').run(id);
  }

  // 清空所有频道
  clearAllChannels() {
    db.prepare('DELETE FROM channels').run();
  }

  // 获取统计信息
  getStats() {
    const total = db.prepare('SELECT COUNT(*) as count FROM channels').get().count;
    const online = db.prepare('SELECT COUNT(*) as count FROM channels WHERE status = ?').get('online').count;
    const offline = db.prepare('SELECT COUNT(*) as count FROM channels WHERE status = ?').get('offline').count;
    const unknown = db.prepare('SELECT COUNT(*) as count FROM channels WHERE status NOT IN (?, ?)').get('online', 'offline').count;
    return { total, online, offline, unknown };
  }
}

module.exports = new ChannelService();
