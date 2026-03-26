const pool = require('../config/db');

exports.createLegacyMessage = async (req, res) => {
  try {
    const { person_id } = req.params;
    const { title, message, emotion_tag } = req.body;
    
    // Create new legacy message
    const result = await pool.query(
      `INSERT INTO legacy_messages (person_id, title, message, emotion_tag) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [person_id, title, message, emotion_tag]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating legacy message' });
  }
};

exports.getLegacyMessages = async (req, res) => {
  try {
    const { person_id } = req.params;
    const result = await pool.query(
      `SELECT * FROM legacy_messages WHERE person_id = $1 ORDER BY created_at DESC`,
      [person_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching legacy messages' });
  }
};
