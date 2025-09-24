const db = require('../db/db');

class GrandPrix {
    static async create(gpData) {
        const { title, country, track, event_date, description } = gpData;
        
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO grand_prix (title, country, track, event_date, description)
                VALUES (?, ?, ?, ?, ?)
            `;

            db.run(query, [title, country, track, event_date, description], 
                function(err) {
                    if (err) return reject(err);
                    
                    this.get('SELECT * FROM grand_prix WHERE id = ?', [this.lastID], (err, row) => {
                        if (err) return reject(err);
                        resolve(row);
                    });
                }
            );
        });
    }

    static async getNext() {
        return new Promise((resolve, reject) => {
            const currentDate = new Date().toISOString();
            const query = `
                SELECT * FROM grand_prix 
                WHERE event_date >= ? AND is_completed = FALSE 
                ORDER BY event_date ASC 
                LIMIT 1
            `;
            db.get(query, [currentDate], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
    }

    static async getUpcoming(limit = 10) {
        return new Promise((resolve, reject) => {
            const currentDate = new Date().toISOString();
            const query = `
                SELECT * FROM grand_prix 
                WHERE event_date >= ? 
                ORDER BY event_date ASC 
                LIMIT ?
            `;
            db.all(query, [currentDate, limit], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }

    static async findAll() {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM grand_prix ORDER BY event_date ASC';
            db.all(query, [], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }
}

module.exports = GrandPrix;