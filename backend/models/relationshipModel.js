const pool = require('../config/db');

/**
 * Creates a relationship between two persons, both of which must belong to
 * a family owned by user_id
 * @param {string} person1_id - ID of the first person
 * @param {string} person2_id - ID of the second person
 * @param {string} relationship_type - Type of relationship (e.g., 'parent', 'child', 'spouse')
 * @param {string} user_id - The ID of the requesting user
 * @returns {Object|null} The created relationship object, or null if not owned
 */
const createRelationship = async (person1_id, person2_id, relationship_type, user_id) => {
  const query = `
    INSERT INTO relationships (person1_id, person2_id, relationship_type)
    SELECT $1, $2, $3
    WHERE EXISTS (
      SELECT 1 FROM persons p JOIN families f ON p.family_id = f.id
      WHERE p.id = $1 AND f.created_by = $4
    ) AND EXISTS (
      SELECT 1 FROM persons p JOIN families f ON p.family_id = f.id
      WHERE p.id = $2 AND f.created_by = $4
    )
    RETURNING *;
  `;
  const values = [person1_id, person2_id, relationship_type, user_id];
  const { rows } = await pool.query(query, values);
  return rows[0] || null;
};

/**
 * Retrieves all relationships for a specific person, scoped to families owned by user_id
 * @param {string} person_id - The ID of the person
 * @param {string} user_id - The ID of the requesting user
 * @returns {Array} List of relationships connected to the person
 */
const getRelationshipsByPerson = async (person_id, user_id) => {
  const query = `
    SELECT r.* FROM relationships r
    WHERE (r.person1_id = $1 OR r.person2_id = $1)
      AND EXISTS (
        SELECT 1 FROM persons p JOIN families f ON p.family_id = f.id
        WHERE p.id = $1 AND f.created_by = $2
      )
    ORDER BY r.created_at DESC;
  `;
  const { rows } = await pool.query(query, [person_id, user_id]);
  return rows;
};

/**
 * Deletes a relationship, scoped to families owned by user_id
 * @param {string} relationship_id - The ID of the relationship to delete
 * @param {string} user_id - The ID of the requesting user
 * @returns {boolean} True if deleted, false if not found/not owned
 */
const deleteRelationship = async (relationship_id, user_id) => {
  const query = `
    DELETE FROM relationships
    WHERE id = $1
      AND EXISTS (
        SELECT 1 FROM persons p JOIN families f ON p.family_id = f.id
        WHERE p.id = relationships.person1_id AND f.created_by = $2
      )
    RETURNING id;
  `;
  const { rows } = await pool.query(query, [relationship_id, user_id]);
  return rows.length > 0;
};

/**
 * Updates a relationship type, scoped to families owned by user_id
 * @param {string} relationship_id - The ID of the relationship
 * @param {string} relationship_type - The new relationship type
 * @param {string} user_id - The ID of the requesting user
 * @returns {Object|null} The updated relationship object
 */
const updateRelationship = async (relationship_id, relationship_type, user_id) => {
  const query = `
    UPDATE relationships
    SET relationship_type = $1
    WHERE id = $2
      AND EXISTS (
        SELECT 1 FROM persons p JOIN families f ON p.family_id = f.id
        WHERE p.id = relationships.person1_id AND f.created_by = $3
      )
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [relationship_type, relationship_id, user_id]);
  return rows[0] || null;
};

module.exports = {
  createRelationship,
  getRelationshipsByPerson,
  deleteRelationship,
  updateRelationship,
};
