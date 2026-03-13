const express = require('express');
const router = express.Router();
const personController = require('../controllers/personController');
const { verifyToken } = require('../middleware/authMiddleware');

// Define person routes (protected)
router.post('/', verifyToken, personController.addPerson);
router.get('/family/:family_id', verifyToken, personController.getPersonsByFamily);
router.get('/:person_id', verifyToken, personController.getPersonById);
router.put('/:person_id', verifyToken, personController.updatePerson);
router.delete('/:person_id', verifyToken, personController.deletePerson);

module.exports = router;
