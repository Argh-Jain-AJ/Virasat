const express = require('express');
const router = express.Router();
const { buildFamilyTreeData } = require('../utils/treeBuilder');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/:family_id', verifyToken, async (req, res, next) => {
  try {
    const data = await buildFamilyTreeData(req.params.family_id);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
