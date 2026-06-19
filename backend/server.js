const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/database');
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);

// Route de test
app.get('/', (req, res) => {
    res.json({ 
        success: true, 
        message: 'API LaafiBa fonctionne ! 🚀',
        version: '1.0.0',
        date: new Date().toISOString()
    });
});

// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Route non trouvée' 
    });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Erreur serveur', 
        error: err.message 
    });
});

// Démarrage du serveur
const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await testConnection();
        
        app.listen(PORT, '0.0.0.0',() => {
            console.log(`🚀 Serveur LaafiBa démarré sur le port ${PORT}`);
            console.log(`📍 API disponible sur http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Impossible de démarrer le serveur:', error);
        process.exit(1);
    }
}

startServer();