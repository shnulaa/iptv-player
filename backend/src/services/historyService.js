const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');

class HistoryService {
  getAll() {
    return db.prepare('SELECT * FROM import_history ORDER BY imported_at DESC LIMIT 20').all();
  }

  add(history) {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO import_history (id, name, url, type, channel_count)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, history.name, history.url || null, history.type, history.channelCount || 0);
    return this.getById(id);
  }

  getById(id) {
    return db.prepare('SELECT * FROM import_history WHERE id = ?').get(id);
  }

  delete(id) {
    db.prepare('DELETE FROM import_history WHERE id = ?').run(id);
  }

  clearAll() {
    db.prepare('DELETE FROM import_history').run();
  }
}

module.exports = new HistoryService();
