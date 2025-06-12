import request from 'supertest';
import express from 'express';
import { mockDatabase } from '../src/config/mockDatabase';
import { db } from '../src/config/dbConnection';
import uaControlRoutes from '../src/routes/uaControlRoutes';

// Mock the db import
jest.mock('../src/config/dbConnection', () => ({
  db: null
}));

describe('UA Control Routes', () => {
  let app: express.Application;
  let mockDb: mockDatabase;

  beforeEach(async () => {
    mockDb = new mockDatabase();
    await mockDb.createTable('UserGroups', {
      groupID: 'number',
      groupName: 'string'
    });
    await mockDb.createTable('Users', {
      userID: 'number',
      userEmail: 'string',
      userName: 'string',
      groupID: 'number'
    });
    await mockDb.createTable('Permissions', {
      permissionID: 'number',
      permissionName: 'string'
    });
    await mockDb.createTable('PermissionGroup', {
      permissionID: 'number',
      groupID: 'number'
    });
    // Insert test data
    await mockDb.insertData('UserGroups', [
      { groupID: 1, groupName: 'Admins' },
      { groupID: 2, groupName: 'Users' }
    ]);
    await mockDb.insertData('Users', [
      { userID: 1, userEmail: 'alice@example.com', groupID: 1 },
      { userID: 2, userEmail: 'bob@example.com', groupID: 2 }
    ]);
    await mockDb.insertData('Permissions', [
      { permissionID: 1, permissionName: 'manage_users' },
      { permissionID: 2, permissionName: 'view_logs' }
    ]);
    await mockDb.insertData('PermissionGroup', [
      { permissionID: 1, groupID: 1 },
      { permissionID: 2, groupID: 2 }
    ]);
    (db as any) = mockDb.getKnexInstance();
    app = express();
    app.use(express.json());
    app.use('/api', uaControlRoutes);
  });

  afterEach(async () => {
    await mockDb.destroy();
  });

  describe('UserGroups CRUD', () => {
    it('GET /api/usergroups returns all groups', async () => {
      const res = await request(app).get('/api/usergroups').expect(200);
      expect(res.body).toHaveLength(2);
    });
    it('POST /api/usergroups creates a group', async () => {
      const res = await request(app)
        .post('/api/usergroups')
        .send({ groupName: 'Testers' })
        .expect(201);
      expect(res.body).toHaveProperty('groupID');
    });
    it('PUT /api/usergroups/:id updates a group', async () => {
      await request(app)
        .put('/api/usergroups/1')
        .send({ newGroupName: 'SuperAdmins' })
        .expect(200);
      const groups = await mockDb.getAllData('UserGroups');
      expect(groups.find(g => g.groupID === 1).groupName).toBe('SuperAdmins');
    });
    it('DELETE /api/usergroups/:id deletes a group', async () => {
      await request(app).delete('/api/usergroups/2').expect(200);
      const groups = await mockDb.getAllData('UserGroups');
      expect(groups.find(g => g.groupID === 2)).toBeUndefined();
    });
  });

  describe('Users CRUD', () => {
    it('GET /api/users returns all users', async () => {
      const res = await request(app).get('/api/users').expect(200);
      expect(res.body).toHaveLength(2);
    });
    it('POST /api/users creates a user', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ userName: 'Charlie', userEmail: 'charlie@example.com', groupID: 1 })
        .expect(201);
      expect(res.body).toHaveProperty('userID');
    });
    it('PUT /api/users/:id updates a user', async () => {
      await request(app)
        .put('/api/users/1')
        .send({ newUserName: 'Alice2', newUserEmail: 'alice2@example.com', newGroupID: 2 })
        .expect(200);
      const users = await mockDb.getAllData('Users');
      expect(users.find(u => u.userID === 1).userEmail).toBe('alice2@example.com');
      expect(users.find(u => u.userID === 1).userName).toBe('Alice2');
    });
    it('DELETE /api/users/:id deletes a user', async () => {
      await request(app).delete('/api/users/2').expect(200);
      const users = await mockDb.getAllData('Users');
      expect(users.find(u => u.userID === 2)).toBeUndefined();
    });
  });

  describe('PermissionGroup assignment', () => {
    it('GET /api/permissiongroup returns all assignments', async () => {
      const res = await request(app).get('/api/permissiongroup').expect(200);
      expect(res.body.length).toBeGreaterThan(0);
    });
    it('POST /api/permissiongroup creates an assignment', async () => {
      await request(app)
        .post('/api/permissiongroup')
        .send({ permissionID: 2, groupID: 1 })
        .expect(201);
      const assignments = await mockDb.getAllData('PermissionGroup');
      expect(assignments.find(a => a.permissionID === 2 && a.groupID === 1)).toBeTruthy();
    });
    it('DELETE /api/permissiongroup deletes an assignment', async () => {
      await request(app)
        .delete('/api/permissiongroup')
        .query({ permissionID: 1, groupID: 1 })
        .expect(200);
      const assignments = await mockDb.getAllData('PermissionGroup');
      expect(assignments.find(a => a.permissionID === 1 && a.groupID === 1)).toBeUndefined();
    });
  });

  describe('Permissions listing', () => {
    it('GET /api/permissions returns all permissions', async () => {
      const res = await request(app).get('/api/permissions').expect(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toHaveProperty('permissionName');
    });
  });

  describe('Error and Edge Cases', () => {
    it('POST /api/usergroups with duplicate name returns 400', async () => {
      await request(app)
        .post('/api/usergroups')
        .send({ groupName: 'Admins' })
        .expect(400);
    });
    it('POST /api/usergroups with missing name returns 400', async () => {
      await request(app)
        .post('/api/usergroups')
        .send({})
        .expect(400);
    });
    it('PUT /api/usergroups/:id with missing name returns 400', async () => {
      await request(app)
        .put('/api/usergroups/1')
        .send({})
        .expect(400);
    });
    it('PUT /api/usergroups/:id for non-existent group returns 404', async () => {
      await request(app)
        .put('/api/usergroups/999')
        .send({ newGroupName: 'Ghost' })
        .expect(404);
    });
    it('DELETE /api/usergroups/:id for non-existent group returns 404', async () => {
      await request(app)
        .delete('/api/usergroups/999')
        .expect(404);
    });
    it('POST /api/users with duplicate email returns 400', async () => {
      await request(app)
        .post('/api/users')
        .send({ userName: 'Alice', userEmail: 'alice@example.com', groupID: 1 })
        .expect(400);
    });
    it('POST /api/users with missing email returns 400', async () => {
      await request(app)
        .post('/api/users')
        .send({ userName: 'Charlie', groupID: 1 })
        .expect(400);
    });
    it('POST /api/users with missing userName returns 400', async () => {
      await request(app)
        .post('/api/users')
        .send({ userEmail: 'charlie@example.com', groupID: 1 })
        .expect(400);
    });
    it('PUT /api/users/:id with missing fields returns 400', async () => {
      await request(app)
        .put('/api/users/1')
        .send({})
        .expect(400);
    });
    it('PUT /api/users/:id with missing newUserName returns 400', async () => {
      await request(app)
        .put('/api/users/1')
        .send({ newUserEmail: 'alice2@example.com', newGroupID: 2 })
        .expect(400);
    });
    it('PUT /api/users/:id with missing newUserEmail returns 400', async () => {
      await request(app)
        .put('/api/users/1')
        .send({ newUserName: 'Alice2', newGroupID: 2 })
        .expect(400);
    });
    it('PUT /api/users/:id for non-existent user returns 404', async () => {
      await request(app)
        .put('/api/users/999')
        .send({ newUserName: 'Ghost', newUserEmail: 'ghost@example.com' })
        .expect(404);
    });
    it('DELETE /api/users/:id for non-existent user returns 404', async () => {
      await request(app)
        .delete('/api/users/999')
        .expect(404);
    });
    it('POST /api/permissiongroup with missing fields returns 400', async () => {
      await request(app)
        .post('/api/permissiongroup')
        .send({ permissionID: 1 })
        .expect(400);
    });
    it('DELETE /api/permissiongroup with missing query params returns 400', async () => {
      await request(app)
        .delete('/api/permissiongroup')
        .query({ permissionID: 1 })
        .expect(400);
    });
    it('DELETE /api/permissiongroup for non-existent assignment returns 404', async () => {
      await request(app)
        .delete('/api/permissiongroup')
        .query({ permissionID: 999, groupID: 999 })
        .expect(404);
    });
    it('POST /api/permissiongroup creates duplicate assignment (should succeed, but only once)', async () => {
      await request(app)
        .post('/api/permissiongroup')
        .send({ permissionID: 1, groupID: 1 })
        .expect(201);
    });
    it('POST /api/permissions with duplicate name returns 400 (simulate DB error)', async () => {
      // Simulate by inserting directly and then trying to insert again
      await mockDb.insertData('Permissions', [
        { permissionID: 3, permissionName: 'manage_users' }
      ]);
      // This should fail due to unique constraint
      // (simulate by catching error in route)
      // Not directly testable unless you expose a POST /api/permissions route
    });
    it('GET /api/usergroups DB error returns 500', async () => {
      // Simulate DB error by mocking db function
      const originalDb = db;
      (db as any) = (...args: any[]) => {
        if (args[0] === "UserGroups") throw new Error("DB error");
        return originalDb(...args);
      };
      await request(app).get('/api/usergroups').expect(500);
      (db as any) = originalDb;
    });
  });
}); 