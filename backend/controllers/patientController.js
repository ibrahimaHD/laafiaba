const Patient = require('../models/Patient');

// Mettre à jour le profil patient
exports.updateProfile = async (req, res) => {
    try {
        const { date_naissance, groupe_sanguin, allergies, antecedents_medicaux, adresse, ville } = req.body;
        
        await Patient.update(req.user.id, {
            date_naissance,
            groupe_sanguin,
            allergies,
            antecedents_medicaux,
            adresse,
            ville
        });

        const updatedPatient = await Patient.findByUserId(req.user.id);

        res.json({
            success: true,
            message: 'Profil mis à jour avec succès',
            patient: updatedPatient
        });
    } catch (error) {
        console.error('Erreur updateProfile:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur', 
            error: error.message 
        });
    }
};

// Obtenir le dossier médical complet (pour le QR code)
exports.getMedicalRecord = async (req, res) => {
    try {
        const { qr_token } = req.params;
        
        const patient = await Patient.findByQrCode(qr_token);
        
        if (!patient) {
            return res.status(404).json({ 
                success: false, 
                message: 'Patient non trouvé' 
            });
        }

        // Ici, on pourrait ajouter les consultations, vaccinations, etc.
        // Pour l'instant, on retourne juste les infos de base

        res.json({
            success: true,
            patient: {
                nom: patient.nom,
                prenom: patient.prenom,
                telephone: patient.telephone,
                date_naissance: patient.date_naissance,
                groupe_sanguin: patient.groupe_sanguin,
                allergies: patient.allergies,
                antecedents_medicaux: patient.antecedents_medicaux
            }
        });
    } catch (error) {
        console.error('Erreur getMedicalRecord:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur', 
            error: error.message 
        });
    }
};