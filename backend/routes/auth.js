const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// Validation des données
const registerValidation = [
    body('telephone')
        .isLength({ min: 10 })
        .withMessage('Le numéro de téléphone doit contenir au moins 10 caractères'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
    body('nom').notEmpty().withMessage('Le nom est requis'),
    body('prenom').notEmpty().withMessage('Le prénom est requis')
];

const loginValidation = [
    body('telephone').notEmpty().withMessage('Le numéro de téléphone est requis'),
    body('password').notEmpty().withMessage('Le mot de passe est requis')
];

router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.get('/profile', auth, authController.getProfile);

module.exports = router;