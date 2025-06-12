import request from 'supertest';
import express from 'express';
import { mockDatabase } from '../src/config/mockDatabase';
import { db } from '../src/config/dbConnection';
import entryRoutes from '../src/routes/entryRoutes';

// Mock the db import
jest.mock('../src/config/dbConnection', () => ({
  db: null
}));

describe('Entry Routes', () => {
  let app: express.Application;
  let mockDb: mockDatabase;
  let testAssetId: number;

  beforeEach(async () => {
    // Create a new mock database instance
    mockDb = new mockDatabase();
    
    // Set up the mock database tables
    await mockDb.createTable('AssetType', {
      assetTypeID: 'number',
      name: 'string',
      category_id: 'number'
    });

    await mockDb.createTable('Asset', {
      assetID: 'number',
      assetTypeID: 'number'
    });

    await mockDb.createTable('Field', {
      fieldID: 'number',
      fieldName: 'string',
      assetTypeID: 'number',
      fieldType: 'string'
    });

    await mockDb.createTable('FieldEnumOptions', {
      fieldID: 'number',
      optionValue: 'string'
    });

    await mockDb.createTable('EntryInt', {
      entryID: 'number',
      assetID: 'number',
      fieldID: 'number',
      value: 'number',
      date: 'date'
    });

    await mockDb.createTable('EntryBool', {
      entryID: 'number',
      assetID: 'number',
      fieldID: 'number',
      trueFalse: 'boolean',
      date: 'date'
    });

    await mockDb.createTable('EntryText', {
      entryID: 'number',
      assetID: 'number',
      fieldID: 'number',
      text: 'string',
      date: 'date'
    });

    // Insert test data
    await mockDb.insertData('AssetType', [
      { assetTypeID: 1, name: 'TestAssetType', category_id: 1 }
    ]);

    await mockDb.insertData('Field', [
      { fieldID: 1, fieldName: 'IntField', assetTypeID: 1, fieldType: 'Double' },
      { fieldID: 2, fieldName: 'BoolField', assetTypeID: 1, fieldType: 'Boolean' },
      { fieldID: 3, fieldName: 'TextField', assetTypeID: 1, fieldType: 'String' },
      { fieldID: 4, fieldName: 'EnumField', assetTypeID: 1, fieldType: 'Enum' }
    ]);

    await mockDb.insertData('FieldEnumOptions', [
      { fieldID: 4, optionValue: 'Option1' },
      { fieldID: 4, optionValue: 'Option2' },
      { fieldID: 4, optionValue: 'Option3' }
    ]);

    // Create a test asset
    await mockDb.insertData('Asset', [
      { assetID: 1, assetTypeID: 1 }
    ]);

    testAssetId = 1;

    // Mock the db instance
    (db as any) = mockDb.getKnexInstance();

    // Create Express app
    app = express();
    app.use(express.json());

    // Use the entry routes
    app.use('/api', entryRoutes);
  });

  afterEach(async () => {
    await mockDb.destroy();
  });

  describe('POST /api/addition/entry', () => {
    it('should create a new asset with multiple entries including enum', async () => {
      const newAsset = {
        assetTypeName: 'TestAssetType',
        entries: [
          { fieldID: 1, value: 42 },
          { fieldID: 2, value: true },
          { fieldID: 3, value: 'Test text' },
          { fieldID: 4, value: 'Option1' }
        ]
      };

      const response = await request(app)
        .post('/api/addition/entry')
        .send(newAsset)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Asset created with entries');
      expect(response.body).toHaveProperty('assetID');
      expect(response.body).toHaveProperty('assetTypeID');
      expect(response.body.successfulEntries).toHaveLength(4);

      // Verify the enum entry was created in EntryText table
      const textEntries = await mockDb.getAllData('EntryText');
      const enumEntry = textEntries.find(entry => entry.fieldID === 4);
      expect(enumEntry).toBeDefined();
      expect(enumEntry.text).toBe('Option1');
    });

    it('should reject invalid enum value', async () => {
      const newAsset = {
        assetTypeName: 'TestAssetType',
        entries: [
          { fieldID: 4, value: 'InvalidOption' }
        ]
      };

      const response = await request(app)
        .post('/api/addition/entry')
        .send(newAsset)
        .expect(400); // The request should fail with invalid enum value

      expect(response.body).toHaveProperty('error', 'Failed to add any entries, asset creation rolled back');
      expect(response.body.details).toBeDefined();
      expect(response.body.details[0].error).toBe('Invalid enum value');
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/addition/entry')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing required fields');
    });

    it('should handle non-existent asset type', async () => {
      const response = await request(app)
        .post('/api/addition/entry')
        .send({
          assetTypeName: 'NonExistentType',
          entries: [{ fieldID: 1, value: 42 }]
        })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'AssetType not found');
    });
  });

  describe('POST /api/entryint', () => {
    it('should create a new integer entry', async () => {
      const newEntry = {
        assetID: testAssetId,
        fieldID: 1,
        value: 42
      };

      const response = await request(app)
        .post('/api/entryint')
        .send(newEntry)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'EntryInt created successfully');
      expect(response.body).toHaveProperty('entryID');
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/entryint')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'assetID, fieldID, and value are required');
    });
  });

  describe('POST /api/entrybool', () => {
    it('should create a new boolean entry', async () => {
      const newEntry = {
        assetID: testAssetId,
        fieldID: 2,
        trueFalse: true
      };

      const response = await request(app)
        .post('/api/entrybool')
        .send(newEntry)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'EntryBool created successfully');
      expect(response.body).toHaveProperty('entryID');
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/entrybool')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'assetID, fieldID, and trueFalse are required');
    });
  });

  describe('POST /api/entrytext', () => {
    it('should create a new text entry for enum field', async () => {
      const newEntry = {
        assetID: testAssetId,
        fieldID: 4,
        text: 'Option2'
      };

      const response = await request(app)
        .post('/api/entrytext')
        .send(newEntry)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'EntryText created successfully');
      expect(response.body).toHaveProperty('entryID');

      // Verify the entry was created
      const entries = await mockDb.getAllData('EntryText');
      const createdEntry = entries.find(entry => entry.fieldID === 4);
      expect(createdEntry).toBeDefined();
      expect(createdEntry.text).toBe('Option2');
    });

    it('should reject invalid enum value for enum field', async () => {
      const newEntry = {
        assetID: testAssetId,
        fieldID: 4,
        text: 'InvalidOption'
      };

      const response = await request(app)
        .post('/api/entrytext')
        .send(newEntry)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid enum value');
    });

    it('should create a new text entry', async () => {
      const newEntry = {
        assetID: testAssetId,
        fieldID: 3,
        text: 'Test text'
      };

      const response = await request(app)
        .post('/api/entrytext')
        .send(newEntry)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'EntryText created successfully');
      expect(response.body).toHaveProperty('entryID');
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/entrytext')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'assetID, fieldID, and text are required');
    });

    it('should handle when a date is provided', async () => {
      const response = await request(app)
        .post('/api/entryint')
        .send({ assetID: testAssetId, fieldID: 1, value: 42, date: '2024-01-01' })
        .expect(201);
        
    })

    it('should handle when no date is provided', async () => {
      const response = await request(app)
        .post('/api/entryint')
        .send({ assetID: testAssetId, fieldID: 1, value: 42 })
        .expect(201);   
    })
  });

  describe('PUT /api/entrybool/:id', () => {
    let testEntryId: number;

    beforeEach(async () => {
      // Create a test boolean entry
      const newEntry = {
        assetID: testAssetId,
        fieldID: 2,
        trueFalse: true
      };

      const response = await request(app)
        .post('/api/entrybool')
        .send(newEntry);

      testEntryId = response.body.entryID;

      // Update the entry ID in the mock database to match the response
      const entries = await mockDb.getAllData('EntryBool');
      const entry = entries[0];
      await mockDb.clearTable('EntryBool');
      await mockDb.insertData('EntryBool', [{
        ...entry,
        entryID: testEntryId
      }]);
    });

    it('should update a boolean entry', async () => {
      const response = await request(app)
        .put(`/api/entrybool/${testEntryId}`)
        .send({ newTrueFalse: false })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'EntryBool updated successfully');
    });

    it('should handle non-existent entry', async () => {
      const response = await request(app)
        .put('/api/entrybool/999')
        .send({ newTrueFalse: false })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'EntryBool not found');
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .put('/api/entrybool/1')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'newTrueFalse is required');
    });
  });

  describe('PUT /api/entrytext/:id', () => {
    let testEntryId: number;

    beforeEach(async () => {
      // Create a test text entry
      const newEntry = {
        assetID: testAssetId,
        fieldID: 3,
        text: 'Original text'
      };

      const response = await request(app)
        .post('/api/entrytext')
        .send(newEntry);

      testEntryId = response.body.entryID;

      // Update the entry ID in the mock database to match the response
      const entries = await mockDb.getAllData('EntryText');
      const entry = entries[0];
      await mockDb.clearTable('EntryText');
      await mockDb.insertData('EntryText', [{
        ...entry,
        entryID: testEntryId
      }]);
    });

    it('should update a text entry', async () => {
      const response = await request(app)
        .put(`/api/entrytext/${testEntryId}`)
        .send({ newText: 'Updated text' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'EntryText updated successfully');
    });

    it('should handle non-existent entry', async () => {
      const response = await request(app)
        .put('/api/entrytext/999')
        .send({ newText: 'Updated text' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'EntryText not found');
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .put('/api/entrytext/1')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'newText is required');
    });

    it('should handle when a date is provided', async () => {
      const response = await request(app)
        .post('/api/entryint')
        .send({ assetID: testAssetId, fieldID: 1, value: 42, date: '2024-01-01' })
        .expect(201);
        
    })

    it('should handle when no date is provided', async () => {
      const response = await request(app)
        .post('/api/entryint')
        .send({ assetID: testAssetId, fieldID: 1, value: 42 })
        .expect(201);   
    })
  });
}); 