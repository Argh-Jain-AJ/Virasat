const express = require('express');
const router = express.Router();
const personController = require('../controllers/personController');
const { verifyToken } = require('../middleware/authMiddleware');
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validationMiddleware');

// Define person routes (protected)
router.post(
  '/', 
  verifyToken, 
  [
    body('first_name').notEmpty().withMessage('First name is required'),
    body('family_id').notEmpty().withMessage('Family ID is required')
  ],
  validateRequest,
  personController.addPerson
);
// Search persons (must come before /:person_id to avoid conflict)
router.get('/search', verifyToken, personController.searchPersons);
router.get('/family/:family_id', verifyToken, personController.getPersonsByFamily);
router.get('/:person_id', verifyToken, personController.getPersonById);
router.put('/:person_id', verifyToken, personController.updatePerson);
router.delete('/:person_id', verifyToken, personController.deletePerson);

module.exports = router;
