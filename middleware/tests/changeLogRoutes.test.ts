import request from 'supertest';
import express from 'express';
import { mockDatabase } from '../src/config/mockDatabase';
import { db } from '../src/config/dbConnection';
import changeLogRoutes from '../src/routes/changeLogRoutes';

// Mock the db import
jest.mock('../src/config/dbConnection', () => ({
  db: null
}));

describe('Change Log Routes', () => {
  let app: express.Application;
  let mockDb: mockDatabase;

  beforeEach(async () => {
    // Create a new mock database instance
    mockDb = new mockDatabase();
    
    // Set up the mock database tables
    await mockDb.createTable('ChangeLog', {
      user_email: 'string',
      action: 'string',
      change_details: 'string',
      timestamp: 'date'
    });

    // Insert test data
    await mockDb.insertData('ChangeLog', [
      { 
        user_email: 'test@example.com', 
        action: 'CREATE', 
        change_details: 'Created new asset', 
        timestamp: '2024-01-01 10:00:00' 
      },
      { 
        user_email: 'test@example.com', 
        action: 'UPDATE', 
        change_details: 'Updated asset details', 
        timestamp: '2024-01-01 11:00:00' 
      },
      { 
        user_email: 'admin@example.com', 
        action: 'DELETE', 
        change_details: 'Deleted asset', 
        timestamp: '2024-01-01 12:00:00' 
      }
    ]);

    // Mock the db instance
    (db as any) = mockDb.getKnexInstance();

    // Create Express app
    app = express();
    app.use(express.json());

    // Use the change log routes
    app.use('/api', changeLogRoutes);
  });

  afterEach(async () => {
    await mockDb.destroy();
  });

  describe('GET /api/change-log', () => {
    it('should return all change logs ordered by timestamp', async () => {
      const response = await request(app)
        .get('/api/change-log')
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0].timestamp).toBe('2024-01-01 12:00:00'); // Most recent first
      expect(response.body[2].timestamp).toBe('2024-01-01 10:00:00'); // Oldest last
    });

    it('should respect the limit parameter', async () => {
      const response = await request(app)
        .get('/api/change-log?limit=2')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].timestamp).toBe('2024-01-01 12:00:00');
      expect(response.body[1].timestamp).toBe('2024-01-01 11:00:00');
    });

    it('should handle database errors gracefully', async () => {
      // Simulate a database error by dropping the table
      await mockDb.dropTable('ChangeLog');

      const response = await request(app)
        .get('/api/change-log')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Error fetching change logs');
    });
  });

  describe('POST /api/change-log', () => {
    it('should create a new change log entry', async () => {
      const newLog = {
        user_email: 'new@example.com',
        action: 'CREATE',
        change_details: 'Created new test entry'
      };

      const response = await request(app)
        .post('/api/change-log')
        .send(newLog)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Change logged successfully');
      expect(response.body).toHaveProperty('id');

      // Verify the entry was created
      const logs = await mockDb.getAllData('ChangeLog');
      const createdLog = logs.find(log => log.id === response.body.id);
      expect(createdLog).toBeDefined();
      expect(createdLog.user_email).toBe(newLog.user_email);
      expect(createdLog.action).toBe(newLog.action);
      expect(createdLog.change_details).toBe(newLog.change_details);
    });

    it('should require user_email and action', async () => {
      const response = await request(app)
        .post('/api/change-log')
        .send({ change_details: 'Missing required fields' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('user_email and action are required');
    });

    it('should handle database errors gracefully', async () => {
      // Simulate a database error by dropping the table
      await mockDb.dropTable('ChangeLog');

      const response = await request(app)
        .post('/api/change-log')
        .send({
          user_email: 'test@example.com',
          action: 'CREATE',
          change_details: 'Test entry'
        })
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Error logging change');
    });
  });
}); 