import request from 'supertest';
import express from 'express';
import { mockDatabase } from '../src/config/mockDatabase';
import { db } from '../src/config/dbConnection';
import categoryRoutes from '../src/routes/categoryRoutes';

// Mock the db import
jest.mock('../src/config/dbConnection', () => ({
  db: null
}));

describe('Category Routes', () => {
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

    // Insert some test data
    await mockDb.insertData('Category', [
      { categoryID: 1, categoryName: 'Livestock' },
      { categoryID: 2, categoryName: 'Produce' },
      { categoryID: 3, categoryName: 'Equipment' }
    ]);

    // Mock the db instance
    (db as any) = mockDb.getKnexInstance();

    // Create Express app
    app = express();
    app.use(express.json());

    // Use the category routes
    app.use('/api', categoryRoutes);
  });

  afterEach(async () => {
    await mockDb.destroy();
  });

  describe('GET /api/Category', () => {
    it('should return all categories', async () => {
      const response = await request(app)
        .get('/api/Category')
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            categoryID: 1,
            categoryName: 'Livestock'
          }),
          expect.objectContaining({
            categoryID: 2,
            categoryName: 'Produce'
          }),
          expect.objectContaining({
            categoryID: 3,
            categoryName: 'Equipment'
          })
        ])
      );
    });
  });

  describe('POST /api/addition/category', () => {
    it('should create a new category', async () => {
      const newCategory = {
        column2: 'New Category'
      };

      const response = await request(app)
        .post('/api/addition/category')
        .send(newCategory)
        .expect(200);

      expect(response.body).toHaveProperty('result');
      expect(response.body.message).toBe('Category inserted successfully');

      // Verify the category was actually created
      const categories = await mockDb.getAllData('Category');
      expect(categories).toHaveLength(4);
      expect(categories).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            categoryName: 'New Category'
          })
        ])
      );
    });
  });

  describe('PUT /api/category/:id', () => {
    it('should update an existing category', async () => {
      const updatedData = {
        newCategoryName: 'Updated Category'
      };

      const response = await request(app)
        .put('/api/category/1')
        .send(updatedData)
        .expect(200);

      expect(response.body.message).toBe('Category updated successfully');

      // Verify the category was actually updated
      const categories = await mockDb.getAllData('Category');
      const updatedCategory = categories.find(c => c.categoryID === 1);
      expect(updatedCategory.categoryName).toBe('Updated Category');
    });

    it('should return 400 when newCategoryName is missing', async () => {
      const updatedData = {};

      await request(app)
        .put('/api/category/1')
        .send(updatedData)
        .expect(400);
    });

    it('should return 404 for non-existent category', async () => {
      const updatedData = {
        newCategoryName: 'Updated Category'
      };

      await request(app)
        .put('/api/category/999')
        .send(updatedData)
        .expect(404);
    });
  });

  describe('DELETE /api/category/:id', () => {
    it('should delete an existing category', async () => {
      await request(app)
        .delete('/api/category/1')
        .expect(200);

      // Verify the category was actually deleted
      const categories = await mockDb.getAllData('Category');
      expect(categories).toHaveLength(2);
      expect(categories.find(c => c.categoryID === 1)).toBeUndefined();
    });

    it('should return 200 even for non-existent category', async () => {
      await request(app)
        .delete('/api/category/999')
        .expect(200);
    });
  });
}); 