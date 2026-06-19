const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const { pool, testConnection } = require('./config/database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
});

// ============================================
// ROUTES AUTHENTIFICATION
// ============================================

// Inscription
app.post('/api/auth/register', [
    body('telephone').isLength({ min: 10 }).withMessage('Téléphone invalide'),
    body('password').isLength({ min: 6 }).withMessage('Mot de passe trop court'),
    body('nom').notEmpty().withMessage('Nom requis'),
    body('prenom').notEmpty().withMessage('Prénom requis')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { telephone, password, nom, prenom, email, role } = req.body;
        console.log('📝 Inscription:', { telephone, nom, prenom });

        // Vérifier si existe
        const [existing] = await pool.execute('SELECT id FROM users WHERE telephone = ?', [telephone]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Téléphone déjà utilisé' });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);
        const uuid = uuidv4();
        const qr_code_token = uuidv4();

        // Créer user
        const [result] = await pool.execute(
            `INSERT INTO users (uuid, role, telephone, password_hash, nom, prenom, email, qr_code_token) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [uuid, role || 'patient', telephone, password_hash, nom, prenom, email || null, qr_code_token]
        );

        const user_id = result.insertId;
        console.log('✅ User créé:', user_id);

        // Créer profil patient
        if (role === 'patient' || !role) {
            await pool.execute(
                `INSERT INTO patients (user_id) VALUES (?)`,
                [user_id]
            );
            console.log('✅ Patient créé');
        }

        // Token
        const token = jwt.sign({ id: user_id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

        res.status(201).json({
            success: true,
            message: 'Inscription réussie',
            token,
            user: {
                id: user_id,
                uuid,
                role: role || 'patient',
                telephone,
                nom,
                prenom,
                email,
                qr_code_token
            }
        });
    } catch (error) {
        console.error('❌ Erreur register:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Connexion
app.post('/api/auth/login', [
    body('telephone').notEmpty().withMessage('Téléphone requis'),
    body('password').notEmpty().withMessage('Mot de passe requis')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { telephone, password } = req.body;
        console.log('🔐 Login:', telephone);

        // Trouver user
        const [users] = await pool.execute('SELECT * FROM users WHERE telephone = ?', [telephone]);
        if (users.length === 0) {
            return res.status(400).json({ success: false, message: 'Identifiants incorrects' });
        }

        const user = users[0];

        // Vérifier password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Identifiants incorrects' });
        }

        if (!user.is_active) {
            return res.status(403).json({ success: false, message: 'Compte désactivé' });
        }

        // Token
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

        console.log('✅ Login réussi:', telephone);

        res.json({
            success: true,
            message: 'Connexion réussie',
            token,
            user: {
                id: user.id,
                uuid: user.uuid,
                role: user.role,
                telephone: user.telephone,
                nom: user.nom,
                prenom: user.prenom,
                email: user.email,
                qr_code_token: user.qr_code_token
            }
        });
    } catch (error) {
        console.error('❌ Erreur login:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Profil
app.get('/api/auth/profile', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ success: false, message: 'Token requis' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [users] = await pool.execute(
            'SELECT id, uuid, role, telephone, nom, prenom, email, qr_code_token FROM users WHERE id = ?',
            [decoded.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User non trouvé' });
        }

        const user = users[0];
        let profile = { ...user };

        if (user.role === 'patient') {
            const [patients] = await pool.execute(
                `SELECT * FROM patients WHERE user_id = ?`,
                [user.id]
            );
            if (patients.length > 0) {
                profile = { ...profile, ...patients[0] };
            }
        }

        res.json({ success: true, profile });
    } catch (error) {
        console.error('❌ Erreur profile:', error);
        res.status(401).json({ success: false, message: 'Token invalide' });
    }
});

// ============================================
// ROUTES PATIENTS
// ============================================

app.put('/api/patients/profile', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ success: false, message: 'Token requis' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { date_naissance, groupe_sanguin, allergies, antecedents_medicaux, adresse, ville } = req.body;

        await pool.execute(
            `UPDATE patients SET date_naissance = ?, groupe_sanguin = ?, allergies = ?, antecedents_medicaux = ?, adresse = ?, ville = ? WHERE user_id = ?`,
            [date_naissance, groupe_sanguin, allergies, antecedents_medicaux, adresse, ville, decoded.id]
        );

        res.json({ success: true, message: 'Profil mis à jour' });
    } catch (error) {
        console.error('❌ Erreur update:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/patients/record/:qr_token', async (req, res) => {
    try {
        const { qr_token } = req.params;
        const [patients] = await pool.execute(
            `SELECT p.*, u.nom, u.prenom, u.telephone 
             FROM patients p 
             JOIN users u ON p.user_id = u.id 
             WHERE u.qr_code_token = ?`,
            [qr_token]
        );

        if (patients.length === 0) {
            return res.status(404).json({ success: false, message: 'Patient non trouvé' });
        }

        res.json({ success: true, patient: patients[0] });
    } catch (error) {
        console.error('❌ Erreur record:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// ROUTE TEST
// ============================================

app.get('/', (req, res) => {
    res.json({ 
        success: true, 
        message: 'API LaafiBa fonctionne ! 🚀',
        routes: {
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            profile: 'GET /api/auth/profile',
            update: 'PUT /api/patients/profile',
            record: 'GET /api/patients/record/:qr_token'
        }
    });
});

// 404
app.use((req, res) => {
    console.log('❌ Route non trouvée:', req.path);
    res.status(404).json({ success: false, message: 'Route non trouvée' });
});

// Erreurs
app.use((err, req, res, next) => {
    console.error('❌ Erreur:', err);
    res.status(500).json({ success: false, message: err.message });
});

// ============================================
// DÉMARRAGE
// ============================================

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await testConnection();
        app.listen(PORT, () => {
            console.log(`\n🚀 Serveur démarré sur http://localhost:${PORT}`);
            console.log(`📡 Routes disponibles:`);
            console.log(`   POST /api/auth/register`);
            console.log(`   POST /api/auth/login`);
            console.log(`   GET  /api/auth/profile\n`);
        });
    } catch (error) {
        console.error('❌ Erreur démarrage:', error);
        process.exit(1);
    }
}

startServer();