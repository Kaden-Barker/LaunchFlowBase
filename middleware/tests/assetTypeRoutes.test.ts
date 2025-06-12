import request from 'supertest';
import express from 'express';
import { mockDatabase} from '../src/config/mockDatabase';
import { db } from '../src/config/dbConnection';
import assetTypeRoutes from '../src/routes/assetTypeRoutes';

// Mock the db import
jest.mock('../src/config/dbConnection', () => ({
  db: null
}));

describe('Asset Type Routes', () => {
  let app: express.Application;
  let mockDb: mockDatabase;

  beforeEach(async () => {
    // Create a new mock database instance
    mockDb = new mockDatabase();
    
    // Set up the mock database tables
    await mockDb.createTable('Category', {
      categoryID: 'number',
      categoryName: 'string'
    });

    await mockDb.createTable('AssetType', {
      assetTypeID: 'number',
      categoryID: 'number',
      name: 'string'
    });

    // Insert test data
    await mockDb.insertData('Category', [
      { categoryID: 1, categoryName: 'Livestock' },
      { categoryID: 2, categoryName: 'Produce' }
    ]);

    await mockDb.insertData('AssetType', [
      { assetTypeID: 1, categoryID: 1, name: 'Cattle' },
      { assetTypeID: 2, categoryID: 1, name: 'Sheep' },
      { assetTypeID: 3, categoryID: 2, name: 'Vegetables' }
    ]);

    // Mock the db instance
    (db as any) = mockDb.getKnexInstance();

    // Create Express app
    app = express();
    app.use(express.json());

    // Use the asset type routes
    app.use('/api', assetTypeRoutes);
  });

  afterEach(async () => {
    await mockDb.destroy();
  });

  describe('GET /api/assettype', () => {
    it('should return all asset types', async () => {
      const response = await request(app)
        .get('/api/assettype')
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            assetTypeID: 1,
            categoryID: 1,
            name: 'Cattle'
          }),
          expect.objectContaining({
            assetTypeID: 2,
            categoryID: 1,
            name: 'Sheep'
          }),
          expect.objectContaining({
            assetTypeID: 3,
            categoryID: 2,
            name: 'Vegetables'
          })
        ])
      );
    });

    it('should filter asset types by categoryID', async () => {
      const response = await request(app)
        .get('/api/assettype?categoryID=1')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            assetTypeID: 1,
            categoryID: 1,
            name: 'Cattle'
          }),
          expect.objectContaining({
            assetTypeID: 2,
            categoryID: 1,
            name: 'Sheep'
          })
        ])
      );
    });
  });

  describe('POST /api/addition/assettype', () => {
    it('should create a new asset type', async () => {
      const newAssetType = {
        column2: 'Livestock',  // category name
        column3: 'Pigs'        // new asset type name
      };

      const response = await request(app)
        .post('/api/addition/assettype')
        .send(newAssetType)
        .expect(200);

      expect(response.body).toHaveProperty('insertResult');
      expect(response.body.message).toBe('Row inserted successfully');

      // Verify the asset type was actually created
      const assetTypes = await mockDb.getAllData('AssetType');
      expect(assetTypes).toHaveLength(4);
      expect(assetTypes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            categoryID: 1,
            name: 'Pigs'
          })
        ])
      );
    });

    it('should return 404 when category does not exist', async () => {
      const newAssetType = {
        column2: 'NonExistentCategory',
        column3: 'New Type'
      };

      await request(app)
        .post('/api/addition/assettype')
        .send(newAssetType)
        .expect(404);
    });
  });

  describe('PUT /api/assettype/:id', () => {
    it('should update an existing asset type', async () => {
      const updatedData = {
        newName: 'Updated Cattle'
      };

      const response = await request(app)
        .put('/api/assettype/1')
        .send(updatedData)
        .expect(200);

      expect(response.body.message).toBe('AssetType updated successfully');

      // Verify the asset type was actually updated
      const assetTypes = await mockDb.getAllData('AssetType');
      const updatedAssetType = assetTypes.find(at => at.assetTypeID === 1);
      expect(updatedAssetType.name).toBe('Updated Cattle');
    });

    it('should return 400 when newName is missing', async () => {
      const updatedData = {};

      await request(app)
        .put('/api/assettype/1')
        .send(updatedData)
        .expect(400);
    });

    it('should return 404 for non-existent asset type', async () => {
      const updatedData = {
        newName: 'Updated Name'
      };

      await request(app)
        .put('/api/assettype/999')
        .send(updatedData)
        .expect(404);
    });
  });

  describe('DELETE /api/assettype/:id', () => {
    it('should delete an existing asset type', async () => {
      await request(app)
        .delete('/api/assettype/1')
        .expect(200);

      // Verify the asset type was actually deleted
      const assetTypes = await mockDb.getAllData('AssetType');
      expect(assetTypes).toHaveLength(2);
      expect(assetTypes.find(at => at.assetTypeID === 1)).toBeUndefined();
    });

    it('should return 200 even for non-existent asset type', async () => {
      await request(app)
        .delete('/api/assettype/999')
        .expect(200);
    });
  });
}); 