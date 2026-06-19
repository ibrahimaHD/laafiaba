const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class User {
    static async create({ role, telephone, password_hash, nom, prenom, email }) {
        const uuid = uuidv4();
        const qr_code_token = uuidv4();
        
        const [result] = await pool.execute(
            `INSERT INTO users (uuid, role, telephone, password_hash, nom, prenom, email, qr_code_token) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [uuid, role, telephone, password_hash, nom, prenom, email, qr_code_token]
        );
        
        return { id: result.insertId, uuid, qr_code_token };
    }

    static async findByTelephone(telephone) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE telephone = ?',
            [telephone]
        );
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await pool.execute(
            'SELECT id, uuid, role, telephone, nom, prenom, email, qr_code_token, is_active, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async findByUuid(uuid) {
        const [rows] = await pool.execute(
            'SELECT id, uuid, role, telephone, nom, prenom, email, qr_code_token, is_active, created_at FROM users WHERE uuid = ?',
            [uuid]
        );
        return rows[0];
    }
}

module.exports = User;