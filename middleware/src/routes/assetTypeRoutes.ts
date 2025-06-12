/**
 * Asset Type Routes
 * 
 * This module defines the API routes for managing asset types,
 * including CRUD operations and related functionality.
 */

import express from 'express';
import { db } from '../config/dbConnection';

const router = express.Router();

/**
 * GET /api/assettype
 * 
 * Retrieves all asset types, optionally filtered by categoryID.
 * 
 * Query Parameters:
 * - categoryID: Optional. If provided, filters asset types by category.
 */
router.get('/assettype', async (req, res) => {
  try {
    // Get the optional categoryID from query params
    const { categoryID } = req.query;
    
    // Build the query conditionally based on whether categoryID is provided
    let query = db("AssetType").select("*");
    
    // If categoryID is provided, filter by it
    if (categoryID) {
      // Convert the query parameter to a number since query params are strings
      query = query.where("categoryID", Number(categoryID));
    }
    
    const rows = await query;
    res.json(rows);
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({ error: "Database query error" });
  }
});

/**
 * POST /api/addition/assettype
 * 
 * Creates a new asset type.
 * 
 * Request Body:
 * - column2: The category name to look up
 * - column3: The name of the new asset type
 */
router.post('/addition/assettype', async (req, res) => {
  const { column2, column3 } = req.body;
  console.log("Received data:", { column2, column3 });
  
  try {
    const rows = await db("Category")
      .select("categoryID")
      .where("categoryName", column2);

    if (rows.length === 0) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    const categoryID = rows[0].categoryID;

    const insertResult = await db("AssetType").insert({
      categoryID,
      name: column3
    });

    console.log("Insert result:", insertResult);
    res.json({ message: "Row inserted successfully", insertResult });
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Database insert error", details: error });
  }
});

/**
 * DELETE /api/assettype/:id
 * 
 * Deletes an asset type by ID.
 * 
 * URL Parameters:
 * - id: The ID of the asset type to delete
 */
router.delete('/assettype/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // db will cascade delete
    // try deleting the asset type
    await db("AssetType").where("assetTypeID", id).delete();
    res.status(200).json({ message: "AssetType deleted successfully" });
  } catch (error) {
    console.error("Database delete error:", error);
    res.status(500).json({ error: "Database delete error" });
  }
});

/**
 * PUT /api/assettype/:id
 * 
 * Updates an asset type by ID.
 * 
 * URL Parameters:
 * - id: The ID of the asset type to update
 * 
 * Request Body:
 * - newName: The new name for the asset type
 */
router.put('/assettype/:id', async (req, res) => {
  const { id } = req.params;
  const { newName } = req.body;

  if (!newName) {
    res.status(400).json({ error: "newName is required" });
    return;
  }

  try {
    const result = await db("AssetType")
      .where("assetTypeID", id)
      .update({ name: newName });
    
    if (result === 0) {
      res.status(404).json({ error: "AssetType not found" });
      return;
    }
    
    res.json({ message: "AssetType updated successfully" });
  } catch (error) {
    console.error("Database update error:", error);
    res.status(500).json({ error: "Database update error" });
  }
});

export default router; 