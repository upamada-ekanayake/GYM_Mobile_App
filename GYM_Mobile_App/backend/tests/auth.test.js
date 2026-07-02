const request = require('supertest');
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');

// Mock Firebase Config
jest.mock('../config/firebase', () => {
  return {
    admin: {
      auth: () => ({
        verifyIdToken: jest.fn().mockImplementation(async (token) => {
          if (token === 'valid-token') {
            return { uid: 'mock-uid-123', email: 'test@aurafit.com' };
          }
          throw new Error('Invalid token signature');
        })
      })
    },
    db: {
      collection: () => ({
        doc: (uid) => ({
          get: async () => {
            if (uid === 'mock-uid-123') {
              return {
                exists: true,
                data: () => ({ Role: 'User', Approve: true })
              };
            }
            return { exists: false };
          }
        })
      })
    }
  };
});

const app = express();
app.use(express.json());
app.get('/test-protected', authMiddleware, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

describe('authMiddleware integration tests', () => {
  it('should return 401 if authorization header is missing', async () => {
    const res = await request(app).get('/test-protected');
    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Authorization token missing');
  });

  it('should return 401 if token is invalid', async () => {
    const res = await request(app)
      .get('/test-protected')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Invalid or expired');
  });

  it('should authorize request and attach user object if token is valid', async () => {
    const res = await request(app)
      .get('/test-protected')
      .set('Authorization', 'Bearer valid-token');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toEqual({
      userId: 'mock-uid-123',
      role: 'User',
      email: 'test@aurafit.com',
      approve: true
    });
  });
});
