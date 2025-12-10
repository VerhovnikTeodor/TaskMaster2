const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const projectRoutes = require('../routes/projects');
const { projects, users } = require('../data/store');
const { authenticateToken } = require('../middleware/auth');

// Nastavitev Express app za testiranje
const app = express();
app.use(express.json());
app.use(authenticateToken);
app.use('/api/projects', projectRoutes);

// Helper funkcija za generiranje testnega tokena
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'taskmaster_secret_key_2024', { expiresIn: '7d' });
};

describe('Project Routes', () => {
  let testUser;
  let authToken;

  beforeEach(() => {
    // Počisti podatke
    projects.length = 0;
    users.length = 0;

    // Ustvari testnega uporabnika
    testUser = {
      id: 'user-test-1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    };
    users.push(testUser);
    authToken = generateToken(testUser.id);
  });

  describe('POST /api/projects', () => {
    test('should create a new project', async () => {
      const newProject = {
        name: 'Test Project',
        description: 'Test Description'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newProject)
        .expect(201);

      expect(response.body).toMatchObject({
        name: newProject.name,
        description: newProject.description,
        ownerId: testUser.id
      });
      expect(response.body).toHaveProperty('id');
      expect(response.body.members).toContain(testUser.id);
      expect(projects.length).toBe(1);
    });

    test('should fail without authentication', async () => {
      const newProject = {
        name: 'Test Project',
        description: 'Test Description'
      };

      await request(app)
        .post('/api/projects')
        .send(newProject)
        .expect(401);
    });

    test('should fail with missing name', async () => {
      const invalidProject = {
        description: 'Test Description'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProject)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/projects', () => {
    beforeEach(() => {
      // Dodaj testne projekte
      projects.push({
        id: 'project-1',
        name: 'My Project',
        description: 'Desc',
        ownerId: testUser.id,
        members: [testUser.id],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      projects.push({
        id: 'project-2',
        name: 'Other Project',
        description: 'Desc',
        ownerId: 'other-user',
        members: [testUser.id],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });

    test('should get all user projects', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });
  });

  describe('PUT /api/projects/:id', () => {
    let testProject;

    beforeEach(() => {
      testProject = {
        id: 'project-1',
        name: 'Original Name',
        description: 'Original Desc',
        ownerId: testUser.id,
        members: [testUser.id],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      projects.push(testProject);
    });

    test('should update project as owner', async () => {
      const updates = {
        name: 'Updated Name',
        description: 'Updated Description'
      };

      const response = await request(app)
        .put(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body).toMatchObject(updates);
    });

    test('should fail to update non-existent project', async () => {
      await request(app)
        .put('/api/projects/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' })
        .expect(404);
    });
  });
});
