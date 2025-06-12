/**
 * Entry Routes
 * 
 * This module defines the API routes for managing entries,
 * including CRUD operations for different entry types (int, bool, text).
 */

import express, { Request, Response } from 'express';
import { db } from '../config/dbConnection';

const router = express.Router();

type Entry = {
  fieldID: number;
  value: number | boolean | string;
}

/**
 * POST /api/addition/entry
 * 
 * Creates a new asset with multiple entries.
 * 
 * Request Body:
 * - assetTypeName: The name of the asset type
 * - entries: Array of entries to add
 */
const addEntry = async (req: Request, res: Response) => {
  const { assetTypeName, entries } = req.body;

  console.log("Received data:", { assetTypeName, entries });

  // Validate required fields
  if (!assetTypeName) {
    res.status(400).json({ 
      error: "Missing required fields", 
      required: "Group Name is required" 
    });
    return;
  }

  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    res.status(400).json({ 
      error: "Missing required fields", 
      required: "entries array is required and must not be empty" 
    });
    return;
  }

  try {
    // Verify that the assetType exists and get its ID
    const assetType = await db("AssetType")
      .where("name", assetTypeName)
      .first();
    
    if (!assetType) {
      res.status(404).json({ error: "AssetType not found" });
      return;
    }

    // Create a new asset
    const assetResult = await db("Asset").insert({
      assetTypeID: assetType.assetTypeID
    });

    const assetID = assetResult[0];
    console.log("New asset created with ID:", assetID);

    // Current date for all entries
    const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    // Process each entry
    const results = [];
    const errors = [];

    for (const entry of entries) {
      const { fieldID, value, date } = entry;
      
      if (!fieldID || value === undefined) {
        errors.push({
          fieldID,
          error: "Missing fieldID or value"
        });
        continue;
      }

      try {
        // Verify that the field exists and get its type
        const field = await db("Field")
          .where("fieldID", fieldID)
          .first();
        
        if (!field) {
          errors.push({
            fieldID,
            error: "Field not found"
          });
          continue;
        }

        // Check if field belongs to the asset type
        if (field.assetTypeID !== assetType.assetTypeID) {
          errors.push({
            fieldID,
            error: "Field does not belong to the specified asset type"
          });
          continue;
        }

        let result;
        let tableName;
        const fieldType = field.fieldType;

        // Use the entry's date if provided, otherwise use current date
        const entryDate = date || currentDate;

        // Determine which table to insert into based on field type
        if (fieldType === 'Double') {
          // Convert value to number if it's not already
          const numericValue = typeof value === 'number' ? value : Number(value);
          
          if (isNaN(numericValue)) {
            errors.push({
              fieldID,
              error: "Value must be convertible to a number for Double field type"
            });
            continue;
          }
          
          tableName = 'EntryInt';
          result = await db(tableName).insert({
            fieldID,
            assetID,
            value: numericValue,
            date: entryDate
          });
        } else if (fieldType === 'Boolean') {
          // Convert value to boolean if it's not already
          let boolValue = value;
          if (typeof value !== 'boolean') {
            if (value.toLowerCase && (value.toLowerCase() === 'true' || value === '1' || value === 1)) {
              boolValue = true;
            } else if (value.toLowerCase && (value.toLowerCase() === 'false' || value === '0' || value === 0)) {
              boolValue = false;
            } else {
              errors.push({
                fieldID,
                error: "Value must be convertible to a boolean for Boolean field type"
              });
              continue;
            }
          }
          
          tableName = 'EntryBool';
          result = await db(tableName).insert({
            fieldID,
            assetID,
            trueFalse: boolValue,
            date: entryDate
          });
        } else if ((fieldType === 'String') || (fieldType === 'Enum')) {
          // Convert value to string if it's not already
          const stringValue = String(value);
          
          // For enum fields, validate the value against allowed options
          if (fieldType === 'Enum') {
            const enumOptions = await db("FieldEnumOptions")
              .where("fieldID", fieldID)
              .select("optionValue");
            
            const allowedValues = enumOptions.map(opt => opt.optionValue);
            if (!allowedValues.includes(stringValue)) {
              errors.push({
                fieldID,
                error: "Invalid enum value"
              });
              continue;
            }
          }
          
          tableName = 'EntryText';
          result = await db(tableName).insert({
            fieldID,
            assetID,
            text: stringValue,
            date: entryDate
          });
        } else {
          errors.push({
            fieldID,
            error: "Invalid field type"
          });
          continue;
        }

        results.push({
          fieldID,
          entryID: result[0],
          tableName,
          fieldType,
          success: true
        });
      } catch (error) {
        console.error(`Error processing entry for fieldID ${fieldID}:`, error);
        errors.push({
          fieldID,
          error: "Database error while processing entry"
        });
      }
    }

    // If no successful entries and we have errors, rollback by deleting the asset
    if (results.length === 0 && errors.length > 0) {
      await db("Asset").where("assetID", assetID).delete();
      res.status(400).json({
        error: "Failed to add any entries, asset creation rolled back",
        details: errors
      });
      return;
    }

    res.status(201).json({ 
      message: "Asset created with entries", 
      assetID,
      assetTypeID: assetType.assetTypeID,
      assetTypeName,
      date: currentDate,
      successfulEntries: results,
      failedEntries: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Database error", details: error });
  }
};

router.post('/addition/entry', addEntry);

/**
 * PUT /api/entryint/:id
 * 
 * Updates an integer entry by ID.
 * 
 * URL Parameters:
 * - id: The ID of the entry to update
 * 
 * Request Body:
 * - newValue: The new value for the entry
 * - date: Optional. The new date for the entry
 */
router.put('/entryint/:id', async (req, res) => {
  const { id } = req.params;
  const { newValue, date } = req.body;

  if (newValue === undefined) {
    res.status(400).json({ error: "newValue is required" });
    return;
  }

  try {
    const entryDate = date || new Date().toISOString().split('T')[0];
    console.log("entryDate for an int update: ", entryDate);
    const result = await db("EntryInt")
      .where("entryID", id)
      .update({ 
        value: newValue, 
        date: entryDate 
      });
    
    if (result === 0) {
      res.status(404).json({ error: "EntryInt not found" });
      return;
    }
    
    res.json({ message: "EntryInt updated successfully" });
  } catch (error) {
    console.error("Database update error:", error);
    res.status(500).json({ error: "Database update error" });
  }
});

/**
 * PUT /api/entrybool/:id
 * 
 * Updates a boolean entry by ID.
 * 
 * URL Parameters:
 * - id: The ID of the entry to update
 * 
 * Request Body:
 * - newTrueFalse: The new value for the entry
 * - date: Optional. The new date for the entry
 */
router.put('/entrybool/:id', async (req, res) => {
  const { id } = req.params;
  const { newTrueFalse, date } = req.body;

  if (newTrueFalse === undefined) {
    res.status(400).json({ error: "newTrueFalse is required" });
    return;
  }

  try {
    const entryDate = date || new Date().toISOString().split('T')[0];
    const result = await db("EntryBool")
      .where("entryID", id)
      .update({ 
        trueFalse: newTrueFalse, 
        date: entryDate 
      });
    
    if (result === 0) {
      res.status(404).json({ error: "EntryBool not found" });
      return;
    }
    
    res.json({ message: "EntryBool updated successfully" });
  } catch (error) {
    console.error("Database update error:", error);
    res.status(500).json({ error: "Database update error" });
  }
});

/**
 * PUT /api/entrytext/:id
 * 
 * Updates a text entry by ID.
 * 
 * URL Parameters:
 * - id: The ID of the entry to update
 * 
 * Request Body:
 * - newText: The new value for the entry
 * - date: Optional. The new date for the entry
 */
router.put('/entrytext/:id', async (req, res) => {
  const { id } = req.params;
  const { newText, date } = req.body;

  if (newText === undefined) {
    res.status(400).json({ error: "newText is required" });
    return;
  }

  try {
    const entryDate = date || new Date().toISOString().split('T')[0];
    const result = await db("EntryText")
      .where("entryID", id)
      .update({ 
        text: newText, 
        date: entryDate 
      });
    
    if (result === 0) {
      res.status(404).json({ error: "EntryText not found" });
      return;
    }
    
    res.json({ message: "EntryText updated successfully" });
  } catch (error) {
    console.error("Database update error:", error);
    res.status(500).json({ error: "Database update error" });
  }
});

/**
 * POST /api/entryint
 * 
 * Creates a new integer entry.
 * 
 * Request Body:
 * - assetID: The ID of the asset
 * - fieldID: The ID of the field
 * - value: The value for the entry
 * - date: Optional. The date for the entry
 */
router.post('/entryint', async (req, res) => {
  const { assetID, fieldID, value, date } = req.body;

  if (!assetID || !fieldID || value === undefined) {
    res.status(400).json({ error: "assetID, fieldID, and value are required" });
    return;
  }

  try {
    const entryDate = date || new Date().toISOString().split('T')[0];
    console.log("entryDate for an int creation: ", entryDate);
    const result = await db("EntryInt").insert({
      assetID,
      fieldID,
      value,
      date: entryDate
    });
    
    res.status(201).json({ 
      message: "EntryInt created successfully",
      entryID: result[0]
    });
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Database insert error" });
  }
});

/**
 * POST /api/entrybool
 * 
 * Creates a new boolean entry.
 * 
 * Request Body:
 * - assetID: The ID of the asset
 * - fieldID: The ID of the field
 * - trueFalse: The value for the entry
 * - date: Optional. The date for the entry
 */
router.post('/entrybool', async (req, res) => {
  const { assetID, fieldID, trueFalse, date } = req.body;

  if (!assetID || !fieldID || trueFalse === undefined) {
    res.status(400).json({ error: "assetID, fieldID, and trueFalse are required" });
    return;
  }

  try {
    const entryDate = date || new Date().toISOString().split('T')[0];
    const result = await db("EntryBool").insert({
      assetID,
      fieldID,
      trueFalse,
      date: entryDate
    });
    
    res.status(201).json({ 
      message: "EntryBool created successfully",
      entryID: result[0]
    });
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Database insert error" });
  }
});

/**
 * POST /api/entrytext
 * 
 * Creates a new text entry.
 * 
 * Request Body:
 * - assetID: The ID of the asset
 * - fieldID: The ID of the field
 * - text: The value for the entry
 * - date: Optional. The date for the entry
 */
router.post('/entrytext', async (req, res) => {
  const { assetID, fieldID, text, date } = req.body;

  if (!assetID || !fieldID || !text) {
    res.status(400).json({ error: "assetID, fieldID, and text are required" });
    return;
  }

  try {
    // Check if this is an enum field
    const field = await db("Field")
      .where("fieldID", fieldID)
      .first();

    if (field && field.fieldType === 'Enum') {
      // Validate enum value
      const enumOptions = await db("FieldEnumOptions")
        .where("fieldID", fieldID)
        .select("optionValue");
      
      const allowedValues = enumOptions.map(opt => opt.optionValue);
      if (!allowedValues.includes(text)) {
        res.status(400).json({ error: "Invalid enum value" });
        return;
      }
    }

    const entryDate = date || new Date().toISOString().split('T')[0];
    const result = await db("EntryText").insert({
      assetID,
      fieldID,
      text,
      date: entryDate
    });
    
    res.status(201).json({ 
      message: "EntryText created successfully",
      entryID: result[0]
    });
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Database insert error" });
  }
});

export default router; 