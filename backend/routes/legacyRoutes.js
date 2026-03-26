const express = require('express');
const router = express.Router();
const legacyController = require('../controllers/legacyController');

router.post('/:person_id', legacyController.createLegacyMessage);
router.get('/:person_id', legacyController.getLegacyMessages);

module.exports = router;
