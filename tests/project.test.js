const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';

let app;
let mongoServer;
let token;
let adminToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  await mongoose.connect(process.env.MONGO_URI);
  app = require('../server');

  const res = await request(app).post('/api/auth/register').send({
    name: 'Project Owner',
    email: 'owner@example.com',
    password: 'password123',
  });
  token = res.body.data.token;

  const admin = await request(app).post('/api/auth/register').send({
    name: 'Project Admin',
    email: 'admin@example.com',
    password: 'password123',
  });
  await mongoose.model('User').findByIdAndUpdate(admin.body.data.user._id, { role: 'admin' });

  const adminLogin = await request(app).post('/api/auth/login').send({
    email: 'admin@example.com',
    password: 'password123',
  });
  adminToken = adminLogin.body.data.token;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe('Project access and validation', () => {
  test('allows a project owner to open a populated project detail', async () => {
    const created = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Launch Plan',
        description: 'Detailed launch plan',
      });

    expect(created.statusCode).toBe(201);

    const detail = await request(app)
      .get(`/api/projects/${created.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(detail.statusCode).toBe(200);
    expect(detail.body.success).toBe(true);
    expect(detail.body.data.name).toBe('Launch Plan');
  });

  test('rejects project descriptions shorter than 10 characters', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Tiny',
        description: 'short',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Project description must be at least 10 characters long');
  });

  test('prevents regular users from deleting projects', async () => {
    const created = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Keep Project',
        description: 'Project should remain after delete attempt',
      });

    const deleted = await request(app)
      .delete(`/api/projects/${created.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleted.statusCode).toBe(403);
    expect(deleted.body.message).toBe('Only admins can delete projects');

    const detail = await request(app)
      .get(`/api/projects/${created.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(detail.statusCode).toBe(200);
  });

  test('allows admins to delete projects', async () => {
    const created = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Delete Project',
        description: 'Project should be deleted by admin',
      });

    const deleted = await request(app)
      .delete(`/api/projects/${created.body.data._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleted.statusCode).toBe(200);
    expect(deleted.body.success).toBe(true);
  });
});
