const pool = require('../config/db');

/**
 * Creates a new memory 
 * @param {Object} memoryData - The memory data
 * @returns {Object} The created memory object
 */
const createMemory = async (memoryData) => {
  const {
    family_id,
    person_id,
    title,
    description,
    media_url,
    media_type,
    event_date
  } = memoryData;

  const query = `
    INSERT INTO memories (
      family_id, person_id, title, description, 
      media_url, media_type, event_date
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;
  
  const values = [
    family_id, person_id, title, description,
    media_url, media_type, event_date
  ];
  
  const { rows } = await pool.query(query, values);
  return rows[0];
};

/**
 * Retrieves all memories for a specific family
 * @param {string} family_id - The ID of the family
 * @returns {Array} List of memories
 */
const getMemoriesByFamily = async (family_id) => {
  const query = `
    SELECT * FROM memories
    WHERE family_id = $1
    ORDER BY event_date DESC NULLS LAST, created_at DESC;
  `;
  const { rows } = await pool.query(query, [family_id]);
  return rows;
};

/**
 * Retrieves all memories linked to a specific person
 * @param {string} person_id - The ID of the person
 * @returns {Array} List of memories
 */
const getMemoriesByPerson = async (person_id) => {
  const query = `
    SELECT * FROM memories
    WHERE person_id = $1
    ORDER BY event_date DESC NULLS LAST, created_at DESC;
  `;
  const { rows } = await pool.query(query, [person_id]);
  return rows;
};

/**
 * Deletes a memory
 * @param {string} memory_id - The ID of the memory to delete
 * @returns {boolean} True if deleted, false if not found
 */
const deleteMemory = async (memory_id) => {
  const query = `
    DELETE FROM memories
    WHERE id = $1
    RETURNING id;
  `;
  const { rows } = await pool.query(query, [memory_id]);
  return rows.length > 0;
};

module.exports = {
  createMemory,
  getMemoriesByFamily,
  getMemoriesByPerson,
  deleteMemory,
};
