const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { auth } = require('../middleware/auth');

router.put('/profile', auth, patientController.updateProfile);
router.get('/record/:qr_token', patientController.getMedicalRecord);

module.exports = router;