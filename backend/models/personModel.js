const pool = require('../config/db');

/**
 * Creates a new person in a family
 * @param {Object} personData - The person's data
 * @returns {Object} The created person object
 */
const createPerson = async (personData) => {
  const {
    family_id,
    first_name,
    last_name,
    gender,
    birth_date,
    death_date,
    birth_place,
    occupation,
    bio,
    photo_url
  } = personData;

  const query = `
    INSERT INTO persons (
      family_id, first_name, last_name, gender, birth_date, 
      death_date, birth_place, occupation, bio, photo_url
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *;
  `;
  
  const values = [
    family_id, first_name, last_name, gender, birth_date,
    death_date, birth_place, occupation, bio, photo_url
  ];
  
  const { rows } = await pool.query(query, values);
  return rows[0];
};

/**
 * Retrieves all persons belonging to a specific family
 * @param {string} family_id - The ID of the family
 * @returns {Array} List of persons in the family
 */
const getPersonsByFamily = async (family_id) => {
  const query = `
    SELECT * FROM persons
    WHERE family_id = $1
    ORDER BY birth_date ASC NULLS LAST;
  `;
  const { rows } = await pool.query(query, [family_id]);
  return rows;
};

/**
 * Retrieves a person by their ID
 * @param {string} person_id - The ID of the person
 * @returns {Object|null} The person object or null if not found
 */
const getPersonById = async (person_id) => {
  const query = `
    SELECT * FROM persons
    WHERE id = $1;
  `;
  const { rows } = await pool.query(query, [person_id]);
  return rows[0] || null;
};

/**
 * Updates a person's details
 * @param {string} person_id - The ID of the person to update
 * @param {Object} updatedData - The person's updatable fields
 * @returns {Object|null} The updated person object
 */
const updatePerson = async (person_id, updatedData) => {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updatedData)) {
    if (value !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (fields.length === 0) return null;

  values.push(person_id);
  const query = `
    UPDATE persons
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *;
  `;

  const { rows } = await pool.query(query, values);
  return rows[0] || null;
};

/**
 * Deletes a person from the database
 * @param {string} person_id - The ID of the person to delete
 * @returns {boolean} True if deleted, false if not found
 */
const deletePerson = async (person_id) => {
  const query = `
    DELETE FROM persons
    WHERE id = $1
    RETURNING id;
  `;
  const { rows } = await pool.query(query, [person_id]);
  return rows.length > 0;
};

module.exports = {
  createPerson,
  getPersonsByFamily,
  getPersonById,
  updatePerson,
  deletePerson,
};
