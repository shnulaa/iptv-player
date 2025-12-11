const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/iptv.db');

// 确保data目录存在
const fs = require('fs');
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// 初始化数据库表
db.exec(`
  CREATE TABLE IF NOT EXISTS channels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    logo TEXT,
    group_title TEXT DEFAULT '未分类',
    tvg_id TEXT,
    tvg_name TEXT,
    status TEXT DEFAULT 'unknown',
    last_tested INTEGER,
    response_time INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS import_history (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT,
    type TEXT NOT NULL,
    channel_count INTEGER DEFAULT 0,
    imported_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_channels_group ON channels(group_title);
  CREATE INDEX IF NOT EXISTS idx_channels_status ON channels(status);
`);

module.exports = db;
