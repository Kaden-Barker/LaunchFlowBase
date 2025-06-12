import request from 'supertest';
import express from 'express';
import { mockDatabase } from '../src/config/mockDatabase';
import { db } from '../src/config/dbConnection';
import assetRoutes from '../src/routes/assetRoutes';

// Mock the db import
jest.mock('../src/config/dbConnection', () => ({
  db: null
}));

describe('Asset Routes', () => {
  let app: express.Application;
  let mockDb: mockDatabase;

  beforeEach(async () => {
    // Create a new mock database instance
    mockDb = new mockDatabase();
    
    // Set up the mock database tables
    await mockDb.createTable('Asset', {
      assetID: 'number',
      assetTypeID: 'number'
    });

    await mockDb.createTable('AssetType', {
      assetTypeID: 'number',
      name: 'string'
    });

    await mockDb.createTable('Field', {
      fieldID: 'number',
      fieldName: 'string',
      assetTypeID: 'number',
      fieldType: 'string'
    });

    await mockDb.createTable('EntryInt', {
      entryID: 'number',
      fieldID: 'number',
      assetID: 'number',
      value: 'number',
      date: 'date'
    });

    await mockDb.createTable('EntryBool', {
      entryID: 'number',
      fieldID: 'number',
      assetID: 'number',
      trueFalse: 'boolean',
      date: 'date'
    });

    await mockDb.createTable('EntryText', {
      entryID: 'number',
      fieldID: 'number',
      assetID: 'number',
      text: 'string',
      date: 'date'
    });

    // Insert test data
    await mockDb.insertData('AssetType', [
      { assetTypeID: 1, name: 'Cattle' },
      { assetTypeID: 2, name: 'Equipment' }
    ]);

    await mockDb.insertData('Asset', [
      { assetID: 1, assetTypeID: 1 },
      { assetID: 2, assetTypeID: 1 },
      { assetID: 3, assetTypeID: 2 }
    ]);

    await mockDb.insertData('Field', [
      { fieldID: 1, fieldName: 'Weight', assetTypeID: 1, fieldType: 'Double' },
      { fieldID: 2, fieldName: 'Age', assetTypeID: 1, fieldType: 'Double' },
      { fieldID: 3, fieldName: 'IsActive', assetTypeID: 2, fieldType: 'Boolean' }
    ]);

    await mockDb.insertData('EntryInt', [
      { entryID: 1, fieldID: 1, assetID: 1, value: 500, date: '2024-01-01' },
      { entryID: 2, fieldID: 2, assetID: 1, value: 2, date: '2024-01-01' }
    ]);

    await mockDb.insertData('EntryBool', [
      { entryID: 1, fieldID: 3, assetID: 3, trueFalse: true, date: '2024-01-01' }
    ]);

    await mockDb.insertData('EntryText', [
      { entryID: 1, fieldID: 4, assetID: 1, text: 'Test Note', date: '2024-01-01' }
    ]);

    // Mock the db instance
    (db as any) = mockDb.getKnexInstance();

    // Create Express app
    app = express();
    app.use(express.json());

    // Use the asset routes
    app.use('/api', assetRoutes);
  });

  afterEach(async () => {
    await mockDb.destroy();
  });

  describe('GET /api/asset', () => {
    it('should return all assets with their type names', async () => {
      const response = await request(app)
        .get('/api/asset')
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            assetID: 1,
            assetTypeID: 1,
            assetTypeName: 'Cattle'
          }),
          expect.objectContaining({
            assetID: 2,
            assetTypeID: 1,
            assetTypeName: 'Cattle'
          }),
          expect.objectContaining({
            assetID: 3,
            assetTypeID: 2,
            assetTypeName: 'Equipment'
          })
        ])
      );
    });
  });

  describe('GET /api/asset/:id', () => {
    it('should return a specific asset with its entries and fields', async () => {
      const response = await request(app)
        .get('/api/asset/1')
        .expect(200);

      expect(response.body).toHaveProperty('asset');
      expect(response.body).toHaveProperty('fields');
      expect(response.body).toHaveProperty('entries');

      expect(response.body.asset).toEqual(
        expect.objectContaining({
          assetID: 1,
          assetTypeID: 1,
          assetTypeName: 'Cattle'
        })
      );

      expect(response.body.fields).toHaveLength(2);
      expect(response.body.entries.double).toHaveLength(2);
    });

    it('should return 404 for non-existent asset', async () => {
      await request(app)
        .get('/api/asset/999')
        .expect(404);
    });
  });

  describe('GET /api/asset/type/:assetTypeID', () => {
    it('should return assets by type', async () => {
      const response = await request(app)
        .get('/api/asset/type/1')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('boolFields');
      expect(response.body[0]).toHaveProperty('textFields');
      expect(response.body[0]).toHaveProperty('intFields');
    });

    it('should filter assets by field value', async () => {
      const response = await request(app)
        .get('/api/asset/type/1?fieldName=Weight&fieldValue=500&operator===')
        .expect(200);

      expect(response.body).toHaveLength(1);
      const intFields = response.body[0].intFields;
      expect(
        intFields.includes('Weight:500:2024-01-01:1') ||
        intFields.includes('Weight:500.0:2024-01-01:1.0')
      ).toBe(true);
    });

    it('should return 404 when no assets match filter', async () => {
      await request(app)
        .get('/api/asset/type/1?fieldName=Weight&fieldValue=1000&operator===')
        .expect(404);
    });
  });

  describe('DELETE /api/asset/:id', () => {
    it('should delete an existing asset', async () => {
      await request(app)
        .delete('/api/asset/1')
        .expect(200);

      // Verify the asset was actually deleted
      const assets = await mockDb.getAllData('Asset');
      expect(assets).toHaveLength(2);
      expect(assets.find(a => a.assetID === 1)).toBeUndefined();
    });

    it('should return 200 even for non-existent asset', async () => {
      await request(app)
        .delete('/api/asset/999')
        .expect(200);
    });
  });
}); 