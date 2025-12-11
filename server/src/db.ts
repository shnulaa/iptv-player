import Database from 'better-sqlite3';
import path from 'path';
import { Channel, ImportHistory } from './types';

const dbPath = path.join(__dirname, '../data/iptv.db');
const db = new Database(dbPath);

// 初始化数据库表
db.exec(`
  CREATE TABLE IF NOT EXISTS channels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    logo TEXT,
    group_name TEXT DEFAULT '未分类',
    status TEXT DEFAULT 'unknown',
    tvg_id TEXT,
    tvg_name TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS import_history (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT,
    channel_count INTEGER DEFAULT 0,
    type TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
  );

  CREATE INDEX IF NOT EXISTS idx_channels_group ON channels(group_name);
  CREATE INDEX IF NOT EXISTS idx_channels_status ON channels(status);
`);

// 频道操作
export const channelDb = {
  getAll: (): Channel[] => {
    return db.prepare('SELECT * FROM channels ORDER BY created_at DESC').all() as Channel[];
  },

  getById: (id: string): Channel | undefined => {
    return db.prepare('SELECT * FROM channels WHERE id = ?').get(id) as Channel | undefined;
  },

  getByGroup: (group: string): Channel[] => {
    if (group === '全部') return channelDb.getAll();
    return db.prepare('SELECT * FROM channels WHERE group_name = ?').all(group) as Channel[];
  },

  getGroups: (): string[] => {
    const rows = db.prepare('SELECT DISTINCT group_name FROM channels ORDER BY group_name').all() as { group_name: string }[];
    return rows.map(r => r.group_name);
  },

  insert: (channel: Omit<Channel, 'created_at' | 'updated_at'>): Channel => {
    const now = Date.now();
    const stmt = db.prepare(`
      INSERT INTO channels (id, name, url, logo, group_name, status, tvg_id, tvg_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      channel.id,
      channel.name,
      channel.url,
      channel.logo || null,
      channel.group_name,
      channel.status,
      channel.tvg_id || null,
      channel.tvg_name || null,
      now,
      now
    );
    return { ...channel, created_at: now, updated_at: now };
  },

  insertMany: (channels: Omit<Channel, 'created_at' | 'updated_at'>[]): void => {
    const now = Date.now();
    const stmt = db.prepare(`
      INSERT INTO channels (id, name, url, logo, group_name, status, tvg_id, tvg_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertMany = db.transaction((channels: Omit<Channel, 'created_at' | 'updated_at'>[]) => {
      for (const channel of channels) {
        stmt.run(
          channel.id,
          channel.name,
          channel.url,
          channel.logo || null,
          channel.group_name,
          channel.status,
          channel.tvg_id || null,
          channel.tvg_name || null,
          now,
          now
        );
      }
    });
    
    insertMany(channels);
  },

  update: (id: string, data: Partial<Channel>): boolean => {
    const channel = channelDb.getById(id);
    if (!channel) return false;

    const updates: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at') {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });

    updates.push('updated_at = ?');
    values.push(Date.now());
    values.push(id);

    const stmt = db.prepare(`UPDATE channels SET ${updates.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);
    return result.changes > 0;
  },

  updateStatus: (id: string, status: Channel['status']): boolean => {
    const stmt = db.prepare('UPDATE channels SET status = ?, updated_at = ? WHERE id = ?');
    const result = stmt.run(status, Date.now(), id);
    return result.changes > 0;
  },

  delete: (id: string): boolean => {
    const result = db.prepare('DELETE FROM channels WHERE id = ?').run(id);
    return result.changes > 0;
  },

  deleteAll: (): void => {
    db.prepare('DELETE FROM channels').run();
  },

  getStats: () => {
    const total = db.prepare('SELECT COUNT(*) as count FROM channels').get() as { count: number };
    const online = db.prepare("SELECT COUNT(*) as count FROM channels WHERE status = 'online'").get() as { count: number };
    const offline = db.prepare("SELECT COUNT(*) as count FROM channels WHERE status = 'offline'").get() as { count: number };
    const unknown = db.prepare("SELECT COUNT(*) as count FROM channels WHERE status = 'unknown'").get() as { count: number };
    
    return {
      total: total.count,
      online: online.count,
      offline: offline.count,
      unknown: unknown.count,
    };
  },

  search: (query: string, group?: string, status?: string): Channel[] => {
    let sql = 'SELECT * FROM channels WHERE 1=1';
    const params: any[] = [];

    if (query) {
      sql += ' AND name LIKE ?';
      params.push(`%${query}%`);
    }

    if (group && group !== '全部') {
      sql += ' AND group_name = ?';
      params.push(group);
    }

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';

    return db.prepare(sql).all(...params) as Channel[];
  },
};

// 导入历史操作
export const historyDb = {
  getAll: (): ImportHistory[] => {
    return db.prepare('SELECT * FROM import_history ORDER BY created_at DESC LIMIT 20').all() as ImportHistory[];
  },

  insert: (history: ImportHistory): void => {
    const stmt = db.prepare(`
      INSERT INTO import_history (id, name, url, channel_count, type, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(history.id, history.name, history.url || null, history.channel_count, history.type, history.created_at);
  },

  delete: (id: string): boolean => {
    const result = db.prepare('DELETE FROM import_history WHERE id = ?').run(id);
    return result.changes > 0;
  },

  deleteAll: (): void => {
    db.prepare('DELETE FROM import_history').run();
  },
};

export default db;
