import knex from "knex";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { db } from "./src/config/dbConnection";
import categoryRoutes from "./src/routes/categoryRoutes";
import assetRoutes from './src/routes/assetRoutes';
import assetTypeRoutes from './src/routes/assetTypeRoutes';
import fieldRoutes from './src/routes/fieldRoutes';
import entryRoutes from './src/routes/entryRoutes';
import changeLogRoutes from './src/routes/changeLogRoutes';
import nlQueryRoutes from './src/routes/nlQueryRoutes';
import uaControlRoutes from './src/routes/uaControlRoutes';
// Load environment variables from .env
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
  origin: ["https://rgf-front-empbi.ondigitalocean.app", "http://localhost:8080"], // Replace with your actual frontend domain
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Routes
app.use('/api', categoryRoutes);
app.use('/api', assetRoutes);
app.use('/api', assetTypeRoutes);
app.use('/api', fieldRoutes);
app.use('/api', entryRoutes);
app.use('/api', changeLogRoutes);
app.use('/api', nlQueryRoutes);
app.use('/api', uaControlRoutes);

// Allowed tables list to prevent SQL injection
const allowedTables: Record<string, string[]> = {
  Category: ["categoryID", "categoryName"],
  AssetType: ["assetTypeID", "category_id", "name"],
  Field: ["fieldID", "fieldName", "assetTypeID", "fieldType"],
  Asset: ["assetID", "assetTypeID"],
  EntryInt: ["entryID", "fieldID", "assetID", "value"],
  EntryBool: ["entryID", "fieldID", "assetID", "trueFalse"],
  EntryText: ["entryID", "fieldID", "assetID", "text"],
};

/**
 * General-purpose query handler for database operations.
 * 
 * This handler implements a flexible SQL-like query interface that supports:
 * - Dynamic column selection
 * - Table joins
 * - Filtering with WHERE conditions
 * 
 * Usage examples:
 * 1. Basic query: GET /api/query/Asset
 * 2. Select specific columns: GET /api/query/Asset?columns=assetID,assetTypeID
 * 3. Apply filters: GET /api/query/Asset?assetTypeID=5
 * 4. Join tables: GET /api/query/Asset?joins=AssetType ON Asset.assetTypeID=AssetType.assetTypeID
 * 5. Combine operations: GET /api/query/Asset?columns=assetID,assetTypeID&assetTypeID=5&joins=AssetType ON Asset.assetTypeID=AssetType.assetTypeID
 * 
 * Security: All tables and columns are validated against an allowlist to prevent SQL injection.
 */
const queryHandler: express.RequestHandler<{ table: string }> = async (
  req,
  res
) => {
  const { table } = req.params;
  const { columns, joins, where } = req.query;

  // Validate table name to prevent SQL injection
  const allowedTables = ['Asset', 'AssetType', 'Category', 'Field', 'EntryInt', 'EntryBool', 'EntryText', 'ChangeLog'];
  if (!allowedTables.includes(table)) {
    res.status(400).json({ error: 'Invalid table name' });
    return;
  }

  try {
    let query = db(table);

    // Handle column selection
    if (columns) {
      const columnList = (columns as string).split(',');
      query = query.select(columnList);
    }

    // Handle joins
    if (joins) {
      const joinList = JSON.parse(joins as string);
      for (const join of joinList) {
        query = query.join(join.table, join.on);
      }
    }

    // Handle where conditions
    if (where) {
      const whereConditions = JSON.parse(where as string);
      for (const condition of whereConditions) {
        query = query.where(condition.column, condition.operator, condition.value);
      }
    }

    const results = await query;
    res.json(results);
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: 'Database query failed' });
  }
};

/**
 * General query endpoint for flexible data retrieval.
 * 
 * Provides a RESTful interface for SQL-like operations with security controls.
 * GET /api/query/:table - Query data with optional filtering and joins
 * 
 * @param {string} :table - The table to query (must be in allowedTables)
 * @query {string} columns - Optional comma-separated list of columns to return
 * @query {string} joins - Optional semicolon-separated list of table joins
 * @query {any} [additional] - Any additional query parameters are used as WHERE filters
 * 
 * @returns {Object[]} JSON array of matching records
 */
app.get("/api/query/:table", queryHandler);


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});