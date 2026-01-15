const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const taskRoutes = require('../routes/tasks');
const { tasks, projects, users } = require('../data/store');
const { authenticateToken } = require('../middleware/auth');


const app = express();
app.use(express.json());
app.use(authenticateToken);
app.use('/api/tasks', taskRoutes);


const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'taskmaster_secret_key_2024', { expiresIn: '7d' });
};

describe('Task Routes', () => {
  let testUser;
  let authToken;
  let testProject;

  beforeEach(() => {
    tasks.length = 0;
    projects.length = 0;
    users.length = 0;

   
    testUser = {
      id: 'user-test-1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    };
    users.push(testUser);
    authToken = generateToken(testUser.id);

 
    testProject = {
      id: 'project-1',
      name: 'Test Project',
      description: 'Test',
      ownerId: testUser.id,
      members: [testUser.id],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    projects.push(testProject);
  });

  describe('POST /api/tasks', () => {
    test('should create a new task', async () => {
      const newTask = {
        title: 'Test Task',
        description: 'Test Description',
        projectId: testProject.id,
        priority: 'high'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newTask)
        .expect(201);

      expect(response.body).toMatchObject({
        title: newTask.title,
        description: newTask.description,
        projectId: testProject.id,
        priority: 'high',
        status: 'TODO',
        createdBy: testUser.id
      });
      expect(response.body).toHaveProperty('id');
      expect(tasks.length).toBe(1);
    });

    test('should fail with invalid project', async () => {
      const newTask = {
        title: 'Test Task',
        projectId: 'non-existent-project',
        priority: 'medium'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newTask)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    test('should fail with missing title', async () => {
      const invalidTask = {
        projectId: testProject.id,
        priority: 'medium'
      };

      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidTask)
        .expect(400);
    });
  });

  describe('GET /api/tasks/project/:projectId', () => {
    beforeEach(() => {
     
      tasks.push({
        id: 'task-1',
        title: 'Task 1',
        description: 'Desc 1',
        projectId: testProject.id,
        status: 'TODO',
        priority: 'high',
        createdBy: testUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      tasks.push({
        id: 'task-2',
        title: 'Task 2',
        description: 'Desc 2',
        projectId: testProject.id,
        status: 'IN_PROGRESS',
        priority: 'medium',
        createdBy: testUser.id,
        assignedTo: testUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });

    test('should get all project tasks', async () => {
      const response = await request(app)
        .get(`/api/tasks/project/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[0]).toHaveProperty('status');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    let testTask;

    beforeEach(() => {
      testTask = {
        id: 'task-1',
        title: 'Original Task',
        description: 'Original Desc',
        projectId: testProject.id,
        status: 'TODO',
        priority: 'medium',
        createdBy: testUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      tasks.push(testTask);
    });

    test('should update task status', async () => {
      const response = await request(app)
        .put(`/api/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'IN_PROGRESS' })
        .expect(200);

      expect(response.body.status).toBe('IN_PROGRESS');
    });

    test('should update task priority', async () => {
      const response = await request(app)
        .put(`/api/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ priority: 'high' })
        .expect(200);

      expect(response.body.priority).toBe('high');
    });

    test('should fail with invalid status', async () => {
      await request(app)
        .put(`/api/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    let testTask;

    beforeEach(() => {
      testTask = {
        id: 'task-1',
        title: 'Task to Delete',
        projectId: testProject.id,
        status: 'TODO',
        priority: 'low',
        createdBy: testUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      tasks.push(testTask);
    });

    test('should delete task as creator', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(tasks.length).toBe(0);
    });

    test('should fail to delete non-existent task', async () => {
      await request(app)
        .delete('/api/tasks/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
