// Временный файл для обратной совместимости
const postgres = require('./postgres');

// Эмуляция SQLite-подобного интерфейса
const db = {
  run: function(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    
    postgres.query(sql, params || [])
      .then(result => {
        if (callback) {
          // Эмулируем SQLite поведение
          const context = {
            lastID: result.rows[0]?.id || 0,
            changes: result.rowCount
          };
          callback.call(context, null);
        }
      })
      .catch(err => {
        if (callback) {
          callback(err);
        }
      });
  },

  get: function(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    
    postgres.query(sql, params || [])
      .then(result => {
        if (callback) {
          callback(null, result.rows[0] || null);
        }
      })
      .catch(err => {
        if (callback) {
          callback(err);
        }
      });
  },

  all: function(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    
    postgres.query(sql, params || [])
      .then(result => {
        if (callback) {
          callback(null, result.rows);
        }
      })
      .catch(err => {
        if (callback) {
          callback(err);
        }
      });
  },

  serialize: function(callback) {
    if (callback) {
      Promise.resolve().then(() => callback());
    }
    return this;
  }
};

module.exports = db;