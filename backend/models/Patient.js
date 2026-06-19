const { pool } = require('../config/database');

class Patient {
    static async create({ user_id, date_naissance, groupe_sanguin, allergies, antecedents_medicaux, adresse, ville }) {
        const [result] = await pool.execute(
            `INSERT INTO patients (user_id, date_naissance, groupe_sanguin, allergies, antecedents_medicaux, adresse, ville) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user_id, date_naissance, groupe_sanguin, allergies, antecedents_medicaux, adresse, ville]
        );
        return result.insertId;
    }

    static async findByUserId(user_id) {
        const [rows] = await pool.execute(
            `SELECT p.*, u.nom, u.prenom, u.telephone, u.email, u.qr_code_token 
             FROM patients p 
             JOIN users u ON p.user_id = u.id 
             WHERE p.user_id = ?`,
            [user_id]
        );
        return rows[0];
    }

    static async update(user_id, data) {
        const { date_naissance, groupe_sanguin, allergies, antecedents_medicaux, adresse, ville } = data;
        
        await pool.execute(
            `UPDATE patients 
             SET date_naissance = ?, groupe_sanguin = ?, allergies = ?, antecedents_medicaux = ?, adresse = ?, ville = ?
             WHERE user_id = ?`,
            [date_naissance, groupe_sanguin, allergies, antecedents_medicaux, adresse, ville, user_id]
        );
    }

    static async findByQrCode(qr_code_token) {
        const [rows] = await pool.execute(
            `SELECT p.*, u.nom, u.prenom, u.telephone, u.email 
             FROM patients p 
             JOIN users u ON p.user_id = u.id 
             WHERE u.qr_code_token = ? AND u.is_active = TRUE`,
            [qr_code_token]
        );
        return rows[0];
    }
}

module.exports = Patient;