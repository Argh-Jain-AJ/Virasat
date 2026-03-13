const pool = require('../config/db');

/**
 * Creates a new family
 * @param {string} family_name - Name of the family
 * @param {string} created_by - User ID who created the family
 * @returns {Object} The created family object
 */
const createFamily = async (family_name, created_by) => {
  const query = `
    INSERT INTO families (family_name, created_by)
    VALUES ($1, $2)
    RETURNING id, family_name, created_by, created_at;
  `;
  const values = [family_name, created_by];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

/**
 * Retrieves all families created by a specific user
 * @param {string} user_id - The ID of the user
 * @returns {Array} List of families
 */
const getFamiliesByUser = async (user_id) => {
  const query = `
    SELECT id, family_name, created_by, created_at
    FROM families
    WHERE created_by = $1
    ORDER BY created_at DESC;
  `;
  const { rows } = await pool.query(query, [user_id]);
  return rows;
};

/**
 * Retrieves a family by its ID
 * @param {string} family_id - The ID of the family
 * @returns {Object|null} The family object or null if not found
 */
const getFamilyById = async (family_id) => {
  const query = `
    SELECT id, family_name, created_by, created_at
    FROM families
    WHERE id = $1;
  `;
  const { rows } = await pool.query(query, [family_id]);
  return rows[0] || null;
};

module.exports = {
  createFamily,
  getFamiliesByUser,
  getFamilyById,
};
