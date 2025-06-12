/**
 * Natural Language Query API Tests
 * 
 * This test suite verifies the functionality of the natural language query API,
 * using the actual OpenAI service to convert natural language to DSL.
 */

import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import nlQueryRoutes from '../src/routes/nlQueryRoutes';
import dotenv from 'dotenv';
import { DSLParser } from '../src/config/DSLParser';
import { mockDatabase } from '../src/config/mockDatabase';
import { db } from '../src/config/dbConnection';

// Mock the loadPromptContext function to provide consistent test data
jest.mock('../src/config/loadPromptContext', () => ({
  loadPromptContext: jest.fn().mockResolvedValue({
    categories: ['cattle', 'produce'],
    assetTypes: ['cows', 'lettuce'],
    fields: ['weaning_weight', 'weight']
  })
}));

// Mock the db import
jest.mock('../src/config/dbConnection', () => ({
  db: null
}));

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use('/api', nlQueryRoutes);

let mockDb: mockDatabase;

beforeAll(async () => {
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

  await mockDb.createTable('EntryInt', {
    entryID: 'number',
    assetID: 'number',
    fieldID: 'number',
    value: 'number',
    date: 'date'
  });

  // Add missing tables
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

  // Insert test data for cows
  await mockDb.insertData('AssetType', [
    { assetTypeID: 1, name: 'cows', category_id: 1 },
    { assetTypeID: 2, name: 'lettuce', category_id: 2 }
  ]);

  await mockDb.insertData('Field', [
    { fieldID: 1, fieldName: 'weaning_weight', assetTypeID: 1, fieldType: 'Double' },
    { fieldID: 2, fieldName: 'weight', assetTypeID: 2, fieldType: 'Double' }
  ]);

  await mockDb.insertData('Asset', [
    { assetID: 1, assetTypeID: 1 },
    { assetID: 2, assetTypeID: 2 }
  ]);

  await mockDb.insertData('EntryInt', [
    { entryID: 1, assetID: 1, fieldID: 1, value: 250, date: '2024-01-01' },
    { entryID: 2, assetID: 2, fieldID: 2, value: 150, date: '2024-01-01' }
  ]);

  // Mock the db instance
  (db as any) = mockDb.getKnexInstance();
});

afterAll(async () => {
  await mockDb.destroy();
});

describe('Natural Language Query API', () => {
  // Test for valid query - cattle weight test
  test(
    'should convert a valid natural language query to DSL', 
    async () => {
      const response = await request(app)
        .get('/api/nlquery')
        .query({ query: 'all the cattle with a weaning weight more than two hundred pounds' })
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('dslQuery');
      
      // Log the actual response
      console.log('Cattle query response:', response.body.dslQuery);
      
      // Assert exact match (case insensitive)
      expect(response.body.dslQuery.toLowerCase()).toBe('cows.weaning_weight > 200');
    }, 
    10000 // Increased timeout for API call
  );

  // Error handling tests (always run - they don't require OpenAI)
  test('should return 400 if query is missing', async () => {
    const response = await request(app)
      .get('/api/nlquery')
      .expect('Content-Type', /json/)
      .expect(400);
    
    expect(response.body).toHaveProperty('error', 'Missing or invalid query');
  });
  
  // Test for simple category query - just "Lettuce"
  test(
    'should handle simple category query "All the Lettuce"', 
    async () => {
      const response = await request(app)
        .get('/api/nlquery')
        .query({ query: 'Lettuce' })
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('dslQuery');
      
      console.log('Lettuce query response:', response.body.dslQuery);
      
      // Assert exact match (case insensitive)
      expect(response.body.dslQuery.toLowerCase()).toBe('lettuce');
    }, 
    10000 // Increased timeout for API call
  );
});

// Testing the DSL Query Route
describe('DSL Query Route', () => {
  test('should process a valid DSL query and return matching assets', async () => {
    const response = await request(app)
      .get('/api/dslquery')
      .query({ query: 'lettuce.weight >= 100' })
      .expect('Content-Type', /json/)
      .expect(200);
    
    console.log('Test response:', JSON.stringify(response.body, null, 2));
    
    expect(response.body).toHaveProperty('dslQuery', 'lettuce.weight >= 100');
    expect(response.body).toHaveProperty('assets');
    expect(response.body.assets).toHaveLength(1);
    expect(response.body).toHaveProperty('assetTypeID', 2);
    expect(response.body).toHaveProperty('assetTypeName', 'lettuce');
  });

  test('should return 400 for invalid DSL query', async () => {
    const response = await request(app)
      .get('/api/dslquery')
      .query({ query: 'invalid query format' })
      .expect('Content-Type', /json/)
      .expect(400);
    
    expect(response.body).toHaveProperty('error', 'DSL Query Parse Error');
    expect(response.body).toHaveProperty('dslQuery', 'invalid query format');
  });

  test('should return 400 if query is missing', async () => {
    const response = await request(app)
      .get('/api/dslquery')
      .expect('Content-Type', /json/)
      .expect(400);
    
    expect(response.body).toHaveProperty('error', 'Missing or invalid query');
  });
});

// Testing the DSL Parser
describe('DSL Parser', () => {
  test('parses full query with >= operator', () => {
    const result = DSLParser('lettuce.weight >= 100');
    expect(result).toEqual({
      query: {
        assetType: 'lettuce',
        field: 'weight',
        operator: '>=',
        value: '100'
      }
    });
  });

  test('parses full query with == operator', () => {
    const result = DSLParser('roma_tomatos.amount == 75');
    expect(result).toEqual({
      query: {
        assetType: 'roma_tomatos',
        field: 'amount',
        operator: '==',
        value: '75'
      }
    });
  });

  test('parses full query with <= operator', () => {
    const result = DSLParser('lettuce.amount <= 100');
    expect(result).toEqual({
      query: {
        assetType: 'lettuce',
        field: 'amount',
        operator: '<=',
        value: '100'
      }
    });
  });

  test('parses simple query with no operator', () => {
    const result = DSLParser('cows');
    expect(result).toEqual({
      query: { assetType: 'cows' }
    });
  });

  test('returns null for invalid query with no field or operator', () => {
    const result = DSLParser('cows weight 200');
    expect(result).toEqual({
      query: null,
      error: "Invalid characters in query. Only lowercase letters and underscores are allowed for simple queries."
    });
  });

  test('returns null for invalid query with missing value', () => {
    const result = DSLParser('lettuce.weight >=');
    expect(result).toEqual({
      query: null,
      error: "Invalid query format. Both sides of the operator must contain values."
    });
  });

  test('returns null for invalid query with missing value', () => {
    const result = DSLParser('lettuce weight');
    expect(result).toEqual({
      query: null,
      error: "Invalid characters in query. Only lowercase letters and underscores are allowed for simple queries."
    });
  });
});
