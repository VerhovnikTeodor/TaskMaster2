const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/auth');
const { users } = require('../data/store');


const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Authentication Routes', () => {
  beforeEach(() => {
    users.length = 0;
  });

  describe('POST /api/auth/register', () => {
    test('should register a new user successfully', async () => {
      const newUser = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toMatchObject({
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      });
      expect(response.body.user).not.toHaveProperty('password');
      expect(users.length).toBe(1);
    });

    test('should fail when email already exists', async () => {
      const user = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

 
      await request(app).post('/api/auth/register').send(user);

 
      const response = await request(app)
        .post('/api/auth/register')
        .send(user)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('obstaja');
    });

    test('should fail with missing fields', async () => {
      const incompleteUser = {
        email: 'test@example.com',
        password: 'password123'
        // firstName in lastName manjkata
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(incompleteUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Ustvari uporabnika za login teste
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });
    });

    test('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toMatchObject({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      });
    });

    test('should fail with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Neveljavni');
    });

    test('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});
