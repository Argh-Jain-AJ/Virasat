import api from '../api/api';

/**
 * Creates a new family
 * @param {Object} data - { family_name }
 */
export const createFamily = async (data) => {
  const response = await api.post('/families', data);
  return response.data;
};

/**
 * Gets all user families
 */
export const getFamilies = async () => {
  const response = await api.get('/families');
  return response.data;
};

/**
 * Creates a new person in a family
 * @param {Object} data 
 */
export const createPerson = async (data) => {
  const response = await api.post('/persons', data);
  return response.data;
};

/**
 * Creates a new relationship between persons
 * @param {Object} data 
 */
export const createRelationship = async (data) => {
  const response = await api.post('/relationships', data);
  return response.data;
};

/**
 * Note: The instruction mentions GET /family-tree/:family_id 
 * The current backend hasn't implemented this exact unified endpoint yet,
 * but assuming it handles aggregation of nodes/edges or we adapt it.
 */
export const getFamilyTree = async (familyId) => {
  const response = await api.get(`/family-tree/${familyId}`);
  return response.data;
};
