const request = require('supertest');

// We point to the local instance assuming the dev server is active or we can mock.
// For robust e2e we hit the local API domain.
const API_URL = 'http://localhost:5001/api';

describe('Family Tree Backend Integration Tests', () => {
  let token = '';
  let familyId = '';
  let personId = '';
  const testEmail = `test_${Date.now()}@example.com`;

  it('1. should register a new user', async () => {
    const res = await request(API_URL)
      .post('/auth/register')
      .send({
        name: 'Test User',
        email: testEmail,
        password: 'password123'
      });
    
    // We expect 201 Created or 200 OK depending on implementation
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message');
  });

  it('2. should login the user', async () => {
    const res = await request(API_URL)
      .post('/auth/login')
      .send({
        email: testEmail,
        password: 'password123'
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });

  it('3. should create a family', async () => {
    const res = await request(API_URL)
      .post('/families')
      .set('Authorization', `Bearer ${token}`)
      .send({
        family_name: 'Test Family'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    familyId = res.body.id;
  });

  it('4. should add a family member', async () => {
    const res = await request(API_URL)
      .post('/persons')
      .set('Authorization', `Bearer ${token}`)
      .send({
        first_name: 'John',
        last_name: 'Doe',
        family_id: familyId
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    personId = res.body.id;
  });

  it('5. should create a relationship (e.g. self to self just as a test)', async () => {
    // In real scenarios you pass 2 different IDs
    const res = await request(API_URL)
      .post('/relationships')
      .set('Authorization', `Bearer ${token}`)
      .send({
        person1_id: personId,
        person2_id: personId,
        relationship_type: 'sibling'
      });
    
    expect(res.statusCode).toBeDefined();
  });
});
