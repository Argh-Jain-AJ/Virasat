const pool = require('../config/db');

/**
 * Creates a relationship between two persons
 * @param {string} person1_id - ID of the first person
 * @param {string} person2_id - ID of the second person
 * @param {string} relationship_type - Type of relationship (e.g., 'parent', 'child', 'spouse')
 * @returns {Object} The created relationship object
 */
const createRelationship = async (person1_id, person2_id, relationship_type) => {
  const query = `
    INSERT INTO relationships (person1_id, person2_id, relationship_type)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const values = [person1_id, person2_id, relationship_type];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

/**
 * Retrieves all relationships for a specific person
 * @param {string} person_id - The ID of the person
 * @returns {Array} List of relationships connected to the person
 */
const getRelationshipsByPerson = async (person_id) => {
  const query = `
    SELECT * FROM relationships
    WHERE person1_id = $1 OR person2_id = $1
    ORDER BY created_at DESC;
  `;
  const { rows } = await pool.query(query, [person_id]);
  return rows;
};

/**
 * Deletes a relationship
 * @param {string} relationship_id - The ID of the relationship to delete
 * @returns {boolean} True if deleted, false if not found
 */
const deleteRelationship = async (relationship_id) => {
  const query = `
    DELETE FROM relationships
    WHERE id = $1
    RETURNING id;
  `;
  const { rows } = await pool.query(query, [relationship_id]);
  return rows.length > 0;
};

/**
 * Updates a relationship type
 * @param {string} relationship_id - The ID of the relationship
 * @param {string} relationship_type - The new relationship type
 * @returns {Object|null} The updated relationship object
 */
const updateRelationship = async (relationship_id, relationship_type) => {
  const query = `
    UPDATE relationships
    SET relationship_type = $1
    WHERE id = $2
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [relationship_type, relationship_id]);
  return rows[0] || null;
};

module.exports = {
  createRelationship,
  getRelationshipsByPerson,
  deleteRelationship,
  updateRelationship,
};
