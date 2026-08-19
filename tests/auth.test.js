const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';

let app;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  await mongoose.connect(process.env.MONGO_URI);
  app = require('../server');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe('POST /api/auth/register', () => {
  test('registers a new user and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('jane@example.com');
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.password).toBeUndefined();
  });

  test('rejects duplicate email registration', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Dup',
      email: 'dup@example.com',
      password: 'password123',
    });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Dup2',
      email: 'dup@example.com',
      password: 'password456',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('rejects login with wrong password', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'correctpass',
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'bob@example.com',
      password: 'wrongpass',
    });

    expect(res.statusCode).toBe(401);
  });
});