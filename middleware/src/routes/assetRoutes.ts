/**
 * Asset Routes
 * 
 * This module defines the API routes for managing assets,
 * including CRUD operations and related functionality.
 */

import express from 'express';
import { db } from '../config/dbConnection';

const router = express.Router();

/**
 * Normalizes text values by converting spaces to underscores and vice versa
 * @param {string} value - The value to normalize
 * @returns {string[]} - Array of possible normalized values
 */
function getNormalizedTextValues(value: string): string[] {
  const normalized = value.toLowerCase();
  return [
    normalized,                    // original value
    normalized.replace(/\s+/g, '_'), // spaces to underscores
    normalized.replace(/_+/g, ' ')  // underscores to spaces
  ];
}

/**
 * Utility function to get assets by type with optional field filtering
 */
async function getAssetsByType(assetTypeID: string, fieldName?: string, fieldValue?: string, operator?: string) {
  try {
    let query = db('Asset')
      .select('Asset.assetID')
      .select(
        db.raw('GROUP_CONCAT(DISTINCT CONCAT(bf.fieldName, \':\', b.trueFalse, \':\', b.date, \':\', b.entryID)) AS boolFields'),
        db.raw('GROUP_CONCAT(DISTINCT CONCAT(ef.fieldName, \':\', e.text, \':\', e.date, \':\', e.entryID)) AS textFields'),
        db.raw('GROUP_CONCAT(DISTINCT CONCAT(iff.fieldName, \':\', i.value, \':\', i.date, \':\', i.entryID)) AS intFields')
      )
      .leftJoin('EntryBool as b', 'Asset.assetID', 'b.assetID')
      .leftJoin('Field as bf', 'b.fieldID', 'bf.fieldID')
      .leftJoin('EntryText as e', 'Asset.assetID', 'e.assetID')
      .leftJoin('Field as ef', 'e.fieldID', 'ef.fieldID')
      .leftJoin('EntryInt as i', 'Asset.assetID', 'i.assetID')
      .leftJoin('Field as iff', 'i.fieldID', 'iff.fieldID')
      .where('Asset.assetTypeID', assetTypeID);

    // Add additional WHERE clause if fieldName and fieldValue are provided
    if (fieldName && fieldValue) {
      // First, get the assetIDs that match our condition
      const matchingAssetIDs = await db('Asset')
        .select('Asset.assetID')
        .leftJoin('EntryBool as b', 'Asset.assetID', 'b.assetID')
        .leftJoin('Field as bf', 'b.fieldID', 'bf.fieldID')
        .leftJoin('EntryText as e', 'Asset.assetID', 'e.assetID')
        .leftJoin('Field as ef', 'e.fieldID', 'ef.fieldID')
        .leftJoin('EntryInt as i', 'Asset.assetID', 'i.assetID')
        .leftJoin('Field as iff', 'i.fieldID', 'iff.fieldID')
        .where('Asset.assetTypeID', assetTypeID)
        .andWhere(function() {
          // For boolean fields
          this.orWhere(function() {
            this.where('bf.fieldName', fieldName)
                .andWhere('b.trueFalse', operator === '==' ? (fieldValue.toLowerCase() === 'true') : fieldValue);
          })
          .orWhere(function() {
            // For text fields
            this.where('ef.fieldName', fieldName);
            if (operator === 'is') {
              const normalizedValues = getNormalizedTextValues(fieldValue); // gets a list of allowed values
              this.andWhere(function() {
                normalizedValues.forEach(value => {
                  this.orWhere('e.text', value);
                });
              });
            } else if (operator === 'like') {
              const normalizedValues = getNormalizedTextValues(fieldValue); // gets a list of allowed values
              this.andWhere(function() {
                normalizedValues.forEach(value => {
                  this.orWhere('e.text', 'like', `%${value}%`);
                });
              });
            }
          })
          .orWhere(function() {
            // For numeric fields
            this.where('iff.fieldName', fieldName);
            if (operator === '==') {
              this.andWhere('i.value', fieldValue);
            } else if (operator === '>') {
              this.andWhere('i.value', '>', fieldValue);
            } else if (operator === '>=') {
              this.andWhere('i.value', '>=', fieldValue);
            } else if (operator === '<') {
              this.andWhere('i.value', '<', fieldValue);
            } else if (operator === '<=') {
              this.andWhere('i.value', '<=', fieldValue);
            } else if (operator === '!=') {
              this.andWhere('i.value', '!=', fieldValue);
            }
          });
        });

      // Then use those assetIDs to get all fields for matching assets
      query = query.whereIn('Asset.assetID', matchingAssetIDs.map(row => row.assetID));
    }

    const results = await query.groupBy('Asset.assetID');
    
    // If fieldName was specified but no results were found, throw a specific error
    if (fieldName && fieldValue && results.length === 0) {
      const error = new Error(`No assets found with field "${fieldName}" ${operator} "${fieldValue}"`);
      error.name = 'NoResultsError';
      throw error;
    }
    
    return results;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

// Export the utility function
export { getAssetsByType };

/**
 * GET /api/asset
 * 
 * Retrieves all assets with their asset type names.
 */
router.get('/asset', async (req, res) => {
  try {
    // Join with AssetType to get the asset type name
    const rows = await db("Asset")
      .select("Asset.*", "AssetType.name as assetTypeName")
      .leftJoin("AssetType", "Asset.assetTypeID", "AssetType.assetTypeID");
    res.json(rows);
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({ error: "Database query error" });
  }
});

/**
 * GET /api/asset/:id
 * 
 * Retrieves a specific asset by ID with its entries and fields.
 * 
 * URL Parameters:
 * - id: The ID of the asset to retrieve
 */
router.get('/asset/:id', async (req, res) => {
  const assetID = req.params.id;
  
  try {
    // Get the asset with its type
    const asset = await db("Asset")
      .select("Asset.*", "AssetType.name as assetTypeName")
      .leftJoin("AssetType", "Asset.assetTypeID", "AssetType.assetTypeID")
      .where("Asset.assetID", assetID)
      .first();
    
    if (!asset) {
      res.status(404).json({ error: "Asset not found" });
      return;
    }
    
    // Get all fields for this asset type
    const fields = await db("Field")
      .where("assetTypeID", asset.assetTypeID);
    
    // Get all entries for this asset
    const intEntries = await db("EntryInt")
      .select("EntryInt.*", "Field.fieldName", "Field.fieldType")
      .leftJoin("Field", "EntryInt.fieldID", "Field.fieldID")
      .where("EntryInt.assetID", assetID);
      
    const boolEntries = await db("EntryBool")
      .select("EntryBool.*", "Field.fieldName", "Field.fieldType")
      .leftJoin("Field", "EntryBool.fieldID", "Field.fieldID")
      .where("EntryBool.assetID", assetID);
      
    const textEntries = await db("EntryText")
      .select("EntryText.*", "Field.fieldName", "Field.fieldType")
      .leftJoin("Field", "EntryText.fieldID", "Field.fieldID")
      .where("EntryText.assetID", assetID);
    
    // Combine all entries
    const entries = {
      double: intEntries,
      boolean: boolEntries,
      text: textEntries
    };
    
    res.json({
      asset,
      fields,
      entries
    });
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({ error: "Database query error" });
  }
});

/**
 * DELETE /api/asset/:id
 * 
 * Deletes an asset by ID.
 * 
 * URL Parameters:
 * - id: The ID of the asset to delete
 */
router.delete('/asset/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // db will cascade delete
    // try deleting the asset
    await db("Asset").where("assetID", id).delete();
    res.status(200).json({ message: "Asset deleted successfully" });
  } catch (error) {
    console.error("Database delete error:", error);
    res.status(500).json({ error: "Database delete error" });
  }
});

/**
 * GET /api/asset/type/:assetTypeID
 * 
 * Retrieves assets by asset type with optional field filtering.
 * 
 * URL Parameters:
 * - assetTypeID: The ID of the asset type to filter by
 * 
 * Query Parameters:
 * - fieldName: Optional. The field name to filter by
 * - fieldValue: Optional. The field value to filter by
 * - operator: Optional. The comparison operator (default: '=')
 */
router.get('/asset/type/:assetTypeID', async (req, res) => {
  const { assetTypeID } = req.params;
  const { fieldName, fieldValue, operator = '=' } = req.query;
  
  try {
    const rows = await getAssetsByType(
      assetTypeID, 
      fieldName as string | undefined, 
      fieldValue as string | undefined, 
      operator as string
    );
    res.json(rows);
  } catch (error: any) {
    console.error("Database query error:", error);
    
    // Handle the specific NoResultsError
    if (error.name === 'NoResultsError') {
      res.status(404).json({ 
        error: error.message,
        code: 'NO_RESULTS_FOUND'
      });
      return;
    }
    
    // Handle other database errors
    res.status(500).json({ error: "Database query error" });
  }
});

export default router; 