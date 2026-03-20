const personModel = require('../models/personModel');

/**
 * Adds a new person to a family
 * @param {Object} personData 
 * @returns {Object} Created person
 */
const addPerson = async (personData) => {
  if (!personData.family_id || !personData.first_name || !personData.last_name) {
    throw new Error('Family ID, first name, and last name are required');
  }
  return await personModel.createPerson(personData);
};

/**
 * Gets all persons in a specific family
 * @param {string} family_id 
 * @returns {Array} List of persons
 */
const getPersonsByFamily = async (family_id) => {
  if (!family_id) {
    throw new Error('Family ID is required');
  }
  return await personModel.getPersonsByFamily(family_id);
};

/**
 * Gets a person by their ID
 * @param {string} person_id 
 * @returns {Object|null} Person object
 */
const getPersonById = async (person_id) => {
  if (!person_id) {
    throw new Error('Person ID is required');
  }
  return await personModel.getPersonById(person_id);
};

/**
 * Updates a person's information
 * @param {string} person_id 
 * @param {Object} updatedData 
 * @returns {Object|null} Updated person
 */
const updatePerson = async (person_id, updatedData) => {
  if (!person_id) {
    throw new Error('Person ID is required');
  }
  // Prevent updating ID or family_id
  const { id, family_id, ...dataToUpdate } = updatedData;
  return await personModel.updatePerson(person_id, dataToUpdate);
};

/**
 * Deletes a person
 * @param {string} person_id 
 * @returns {boolean} Success status
 */
const deletePerson = async (person_id) => {
  if (!person_id) {
    throw new Error('Person ID is required');
  }
  return await personModel.deletePerson(person_id);
};

const searchPersons = async (query) => {
  if (!query || query.trim().length < 2) throw new Error('Search query too short');
  return await personModel.searchPersons(query.trim());
};

module.exports = {
  addPerson,
  getPersonsByFamily,
  getPersonById,
  updatePerson,
  deletePerson,
  searchPersons,
};
