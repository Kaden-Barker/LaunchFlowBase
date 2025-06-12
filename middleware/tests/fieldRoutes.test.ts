import request from 'supertest';
import express from 'express';
import { mockDatabase } from '../src/config/mockDatabase';
import { db } from '../src/config/dbConnection';
import fieldRoutes from '../src/routes/fieldRoutes';

// Mock the db import
jest.mock('../src/config/dbConnection', () => ({
  db: null
}));

describe('Field Routes', () => {
  let app: express.Application;
  let mockDb: mockDatabase;

  beforeEach(async () => {
    // Create a new mock database instance
    mockDb = new mockDatabase();
    
    // Set up the mock database tables
    await mockDb.createTable('Field', {
      fieldID: 'number',
      fieldName: 'string',
      assetTypeID: 'number',
      fieldType: 'string',
      units: 'string'
    });

    await mockDb.createTable('AssetType', {
      assetTypeID: 'number',
      name: 'string',
      categoryID: 'number'
    });

    await mockDb.createTable('FieldEnumOptions', {
      fieldID: 'number',
      optionValue: 'string'
    });

    // Insert test data
    await mockDb.insertData('AssetType', [
      { assetTypeID: 1, name: 'Cattle', categoryID: 1 },
      { assetTypeID: 2, name: 'Sheep', categoryID: 1 }
    ]);

    await mockDb.insertData('Field', [
      { fieldID: 1, fieldName: 'Weight', assetTypeID: 1, fieldType: 'Double', units: 'kg' },
      { fieldID: 2, fieldName: 'Age', assetTypeID: 1, fieldType: 'Double', units: 'years' },
      { fieldID: 3, fieldName: 'IsHealthy', assetTypeID: 1, fieldType: 'Boolean', units: null },
      { fieldID: 4, fieldName: 'Breed', assetTypeID: 1, fieldType: 'Enum', units: null }
    ]);

    await mockDb.insertData('FieldEnumOptions', [
      { fieldID: 4, optionValue: 'Angus' },
      { fieldID: 4, optionValue: 'Hereford' },
      { fieldID: 4, optionValue: 'Brahman' }
    ]);

    // Mock the db instance
    (db as any) = mockDb.getKnexInstance();

    // Create Express app
    app = express();
    app.use(express.json());

    // Use the field routes
    app.use('/api', fieldRoutes);
  });

  afterEach(async () => {
    await mockDb.destroy();
  });

  describe('GET /api/field', () => {
    it('should return all fields', async () => {
      const response = await request(app)
        .get('/api/field')
        .expect(200);

      expect(response.body).toHaveLength(4);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fieldID: 1,
            fieldName: 'Weight',
            fieldType: 'Double',
            units: 'kg'
          }),
          expect.objectContaining({
            fieldID: 2,
            fieldName: 'Age',
            fieldType: 'Double',
            units: 'years'
          }),
          expect.objectContaining({
            fieldID: 3,
            fieldName: 'IsHealthy',
            fieldType: 'Boolean',
            units: null
          }),
          expect.objectContaining({
            fieldID: 4,
            fieldName: 'Breed',
            fieldType: 'Enum',
            units: null
          })
        ])
      );
    });

    it('should filter fields by assetTypeID', async () => {
      const response = await request(app)
        .get('/api/field?assetTypeID=1')
        .expect(200);

      expect(response.body).toHaveLength(4);
      expect(response.body.every((field: any) => field.assetTypeID === 1)).toBe(true);
    });

    it('should return all fields with enum options when field type is Enum', async () => {
      const response = await request(app)
        .get('/api/field')
        .expect(200);

      const breedField = response.body.find((field: any) => field.fieldName === 'Breed');
      expect(breedField).toBeDefined();
      expect(breedField.fieldType).toBe('Enum');
      expect(breedField.enumOptions).toEqual(['Angus', 'Hereford', 'Brahman']);
    });
  });

  describe('POST /api/addition/field', () => {
    it('should create a new field', async () => {
      const newField = {
        assetTypeName: 'Cattle',
        fieldName: 'New Field',
        fieldType: 'String',
        units: 'units'
      };

      const response = await request(app)
        .post('/api/addition/field')
        .send(newField)
        .expect(200);

      expect(response.body).toHaveProperty('fieldId');
      expect(response.body.message).toBe('Field inserted successfully');

      // Verify the field was actually created
      const fields = await mockDb.getAllData('Field');
      expect(fields).toHaveLength(5);
      expect(fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fieldName: 'New Field',
            fieldType: 'String',
            units: 'units'
          })
        ])
      );
    });

    it('should return 400 for invalid fieldType', async () => {
      const invalidField = {
        assetTypeName: 'Cattle',
        fieldName: 'Invalid Field',
        fieldType: 'InvalidType',
        units: 'units'
      };

      await request(app)
        .post('/api/addition/field')
        .send(invalidField)
        .expect(400);
    });

    it('should return 404 for non-existent assetType', async () => {
      const newField = {
        assetTypeName: 'NonExistentType',
        fieldName: 'New Field',
        fieldType: 'String',
        units: 'units'
      };

      await request(app)
        .post('/api/addition/field')
        .send(newField)
        .expect(404);
    });

    it('should create a new enum field with options', async () => {
      const newEnumField = {
        assetTypeName: 'Cattle',
        fieldName: 'New Enum Field',
        fieldType: 'Enum',
        units: null,
        enumOptions: ['Option1', 'Option2', 'Option3']
      };

      const response = await request(app)
        .post('/api/addition/field')
        .send(newEnumField)
        .expect(200);

      expect(response.body).toHaveProperty('fieldId');
      expect(response.body.message).toBe('Field inserted successfully');

      // Verify the field was created
      const fields = await mockDb.getAllData('Field');
      const newField = fields.find(f => f.fieldName === 'New Enum Field');
      expect(newField).toBeDefined();
      expect(newField.fieldType).toBe('Enum');

      // Verify the enum options were created
      const enumOptions = await mockDb.getAllData('FieldEnumOptions');
      const newFieldOptions = enumOptions.filter(opt => opt.fieldID === response.body.fieldId);
      expect(newFieldOptions).toHaveLength(3);
      expect(newFieldOptions.map(opt => opt.optionValue)).toEqual(['Option1', 'Option2', 'Option3']);
    });

    it('should return 400 when creating enum field without options', async () => {
      const invalidEnumField = {
        assetTypeName: 'Cattle',
        fieldName: 'Invalid Enum Field',
        fieldType: 'Enum',
        units: null
        // Missing enumOptions
      };

      await request(app)
        .post('/api/addition/field')
        .send(invalidEnumField)
        .expect(400);
    });
  });

  describe('PUT /api/field/:id', () => {
    it('should update an existing field', async () => {
      const updatedData = {
        newFieldName: 'Updated Field',
        newFieldType: 'Boolean',
        newUnits: null
      };

      const response = await request(app)
        .put('/api/field/1')
        .send(updatedData)
        .expect(200);

      expect(response.body.message).toBe('Field updated successfully');

      // Verify the field was actually updated
      const fields = await mockDb.getAllData('Field');
      const updatedField = fields.find(f => f.fieldID === 1);
      expect(updatedField.fieldName).toBe('Updated Field');
      expect(updatedField.fieldType).toBe('Boolean');
      expect(updatedField.units).toBeNull();
    });

    it('should return 400 when required fields are missing', async () => {
      const invalidData = {
        newFieldName: 'Updated Field'
        // Missing newFieldType
      };

      await request(app)
        .put('/api/field/1')
        .send(invalidData)
        .expect(400);
    });

    it('should return 404 for non-existent field', async () => {
      const updatedData = {
        newFieldName: 'Updated Field',
        newFieldType: 'String',
        newUnits: 'units'
      };

      await request(app)
        .put('/api/field/999')
        .send(updatedData)
        .expect(404);
    });

    it('should update an enum field and its options', async () => {
      const updatedData = {
        newFieldName: 'Updated Enum Field',
        newFieldType: 'Enum',
        newUnits: null,
        newEnumOptions: ['NewOption1', 'NewOption2']
      };

      const response = await request(app)
        .put('/api/field/4') // Using the existing enum field
        .send(updatedData)
        .expect(200);

      expect(response.body.message).toBe('Field updated successfully');

      // Verify the field was updated
      const fields = await mockDb.getAllData('Field');
      const updatedField = fields.find(f => f.fieldID === 4);
      expect(updatedField.fieldName).toBe('Updated Enum Field');

      // Verify the enum options were updated
      const enumOptions = await mockDb.getAllData('FieldEnumOptions');
      const updatedOptions = enumOptions.filter(opt => opt.fieldID === 4);
      expect(updatedOptions).toHaveLength(2);
      expect(updatedOptions.map(opt => opt.optionValue)).toEqual(['NewOption1', 'NewOption2']);
    });

    it('should return 400 when updating to enum type without options', async () => {
      const invalidData = {
        newFieldName: 'Invalid Update',
        newFieldType: 'Enum',
        newUnits: null
        // Missing newEnumOptions
      };

      await request(app)
        .put('/api/field/1')
        .send(invalidData)
        .expect(400);
    });
  });

  describe('DELETE /api/field/:id', () => {
    it('should delete an existing field', async () => {
      await request(app)
        .delete('/api/field/1')
        .expect(200);

      // Verify the field was actually deleted
      const fields = await mockDb.getAllData('Field');
      expect(fields).toHaveLength(3);
      expect(fields.find(f => f.fieldID === 1)).toBeUndefined();
    });

    it('should return 200 even for non-existent field', async () => {
      await request(app)
        .delete('/api/field/999')
        .expect(200);
    });
  });
}); 