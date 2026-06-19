const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Patient = require('../models/Patient');


// Inscription
exports.register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: errors.array()
            });
        }

        const { telephone, password, nom, prenom, email, role } = req.body;

        console.log('📝 Tentative d\'inscription:', { telephone, nom, prenom });

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findByTelephone(telephone);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Ce numéro de téléphone est déjà utilisé'
            });
        }

        // Hasher le mot de passe
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Créer l'utilisateur
        const user = await User.create({
            role: role || 'patient',
            telephone,
            password_hash,
            nom,
            prenom,
            email: email || null
        });

        console.log('✅ Utilisateur créé:', user.id);

        // Si c'est un patient, créer son profil
        if (user && (role === 'patient' || !role)) {
            await Patient.create({ user_id: user.id });
            console.log('✅ Profil patient créé');
        }

        // Générer le token JWT
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        res.status(201).json({
            success: true,
            message: 'Inscription réussie',
            token,
            user: {
                id: user.id,
                uuid: user.uuid,
                role: role || 'patient',
                telephone,
                nom,
                prenom,
                email,
                qr_code_token: user.qr_code_token
            }
        });
    } catch (error) {
        console.error('❌ Erreur register:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
};

// Connexion
exports.login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: errors.array()
            });
        }

        const { telephone, password } = req.body;

        console.log('🔐 Tentative de connexion:', telephone);

        // Trouver l'utilisateur
        const user = await User.findByTelephone(telephone);
        if (!user) {
            console.log('❌ Utilisateur non trouvé');
            return res.status(400).json({
                success: false,
                message: 'Identifiants incorrects'
            });
        }

        // Vérifier le mot de passe
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            console.log('❌ Mot de passe incorrect');
            return res.status(400).json({
                success: false,
                message: 'Identifiants incorrects'
            });
        }

        // Vérifier si le compte est actif
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Compte désactivé'
            });
        }

        // Générer le token
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        console.log('✅ Connexion réussie pour:', telephone);

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
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
};
// Obtenir le profil de l'utilisateur connecté
exports.getProfile = async (req, res) => {
    try {
        const user = req.user;

        let profile = { ...user };

        // Si c'est un patient, récupérer ses infos médicales
        if (user.role === 'patient') {
            const patient = await Patient.findByUserId(user.id);
            profile = { ...profile, ...patient };
        }

        res.json({
            success: true,
            profile
        });
    } catch (error) {
        console.error('Erreur getProfile:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
};