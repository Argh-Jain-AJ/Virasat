const express = require('express');
const router = express.Router();
const familyController = require('../controllers/familyController');
const { verifyToken } = require('../middleware/authMiddleware');
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validationMiddleware');

// Define family routes (protected)
router.post(
  '/', 
  verifyToken, 
  [
    body('family_name').notEmpty().withMessage('Family name is required')
  ],
  validateRequest,
  familyController.createFamily
);
router.get('/', verifyToken, familyController.getFamilies);
router.get('/:family_id', verifyToken, familyController.getFamilyById);

module.exports = router;
