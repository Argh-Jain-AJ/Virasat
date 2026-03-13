const relationshipModel = require('../models/relationshipModel');

/**
 * Creates a new relationship between two persons
 * @param {string} person1_id 
 * @param {string} person2_id 
 * @param {string} relationship_type 
 * @returns {Object} The created relationship
 */
const createRelationship = async (person1_id, person2_id, relationship_type) => {
  if (!person1_id || !person2_id || !relationship_type) {
    throw new Error('Both person IDs and relationship type are required');
  }
  
  if (person1_id === person2_id) {
    throw new Error('Cannot create a relationship with the same person');
  }
  
  return await relationshipModel.createRelationship(person1_id, person2_id, relationship_type);
};

/**
 * Gets all relationships for a person
 * @param {string} person_id 
 * @returns {Array} List of relationships
 */
const getRelationshipsByPerson = async (person_id) => {
  if (!person_id) {
    throw new Error('Person ID is required');
  }
  return await relationshipModel.getRelationshipsByPerson(person_id);
};

/**
 * Deletes a relationship
 * @param {string} relationship_id 
 * @returns {boolean} Success status
 */
const deleteRelationship = async (relationship_id) => {
  if (!relationship_id) {
    throw new Error('Relationship ID is required');
  }
  return await relationshipModel.deleteRelationship(relationship_id);
};

module.exports = {
  createRelationship,
  getRelationshipsByPerson,
  deleteRelationship
};
