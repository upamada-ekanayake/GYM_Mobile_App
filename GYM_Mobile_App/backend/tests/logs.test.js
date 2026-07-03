const request = require('supertest');
const express = require('express');
const { User_LogWater, User_LogCalorie } = require('../controllers/UserController');

// Mock Firebase Config
jest.mock('../config/firebase', () => {
  return {
    admin: {
      firestore: {
        FieldValue: {
          arrayUnion: (val) => val
        }
      }
    },
    db: {
      collection: () => ({
        doc: (uid) => ({
          get: async () => {
            if (uid === 'mock-uid-123') {
              return { exists: true };
            }
            return { exists: false };
          },
          update: async () => {}
        })
      })
    }
  };
});

const app = express();
app.use(express.json());
app.patch('/api/user/user-log-water/:userId', User_LogWater);
app.patch('/api/user/user-log-calorie/:userId', User_LogCalorie);

describe('UserController Logging Endpoints Integration Tests', () => {
  describe('Log Water', () => {
    it('should return 400 if amount is missing or invalid', async () => {
      const res = await request(app)
        .patch('/api/user/user-log-water/mock-uid-123')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('water amount is required');
    });

    it('should return 404 if user not found', async () => {
      const res = await request(app)
        .patch('/api/user/user-log-water/nonexistent-uid')
        .send({ amount: 250 });
      expect(res.status).toBe(404);
      expect(res.body.message).toContain('User not found');
    });

    it('should return 200 on successful water logging', async () => {
      const res = await request(app)
        .patch('/api/user/user-log-water/mock-uid-123')
        .send({ amount: 250 });
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Water logged successfully');
      expect(res.body.entry.amount).toBe(250);
    });
  });

  describe('Log Calorie', () => {
    it('should return 400 if foodName or calories are missing', async () => {
      const res = await request(app)
        .patch('/api/user/user-log-calorie/mock-uid-123')
        .send({ foodName: 'Apple' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Food name and valid calorie');
    });

    it('should return 200 on successful calorie logging', async () => {
      const res = await request(app)
        .patch('/api/user/user-log-calorie/mock-uid-123')
        .send({ foodName: 'Apple', calories: 95 });
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Calorie logged successfully');
      expect(res.body.entry.foodName).toBe('Apple');
      expect(res.body.entry.calories).toBe(95);
    });
  });
});
