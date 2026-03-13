const express = require('express');
const router = express.Router();
const familyController = require('../controllers/familyController');
const { verifyToken } = require('../middleware/authMiddleware');

// Define family routes (protected)
router.post('/', verifyToken, familyController.createFamily);
router.get('/', verifyToken, familyController.getFamilies);
router.get('/:family_id', verifyToken, familyController.getFamilyById);

module.exports = router;
