const express = require('express');
const router = express.Router();
const personController = require('../controllers/personController');
const { verifyToken } = require('../middleware/authMiddleware');
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validationMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');

// ── Photo upload (multer disk storage) ──────────────────────
const uploadDir = path.join(__dirname, '../uploads/persons');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    cb(null, `person_${req.params.person_id}_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

// Upload / replace photo for a person
router.post(
  '/:person_id/photo',
  verifyToken,
  upload.single('photo'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const baseUrl  = `${req.protocol}://${req.get('host')}`;
      const photoUrl = `${baseUrl}/uploads/persons/${req.file.filename}`;
      await pool.query(
        'UPDATE persons SET photo_url = $1 WHERE id = $2 RETURNING *',
        [photoUrl, req.params.person_id]
      );
      res.json({ photo_url: photoUrl });
    } catch (err) {
      console.error('Photo upload error:', err);
      res.status(500).json({ error: 'Failed to upload photo' });
    }
  }
);

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

