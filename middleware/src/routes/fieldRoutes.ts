/**
 * Field Routes
 * 
 * This module defines the API routes for managing fields,
 * including CRUD operations and related functionality.
 */

import express from 'express';
import { db } from '../config/dbConnection';

const router = express.Router();

/**
 * GET /api/field
 * 
 * Retrieves all fields, optionally filtered by assetTypeID.
 * 
 * Query Parameters:
 * - assetTypeID: Optional. If provided, filters fields by asset type.
 */
router.get('/field', async (req, res) => {
  try {
    // Get the optional assetTypeID from query params
    const { assetTypeID } = req.query;
    
    // Build the query conditionally based on whether assetTypeID is provided
    let query = db("Field").select("*");
    
    // If assetTypeID is provided, filter by it
    if (assetTypeID) {
      // Convert the query parameter to a number since query params are strings
      query = query.where("assetTypeID", Number(assetTypeID));
    }
    
    const rows = await query;

    // For each field of type Enum, fetch its options
    const fieldsWithOptions = await Promise.all(rows.map(async (field) => {
      if (field.fieldType === 'Enum') {
        const options = await db("FieldEnumOptions")
          .select("optionValue")
          .where("fieldID", field.fieldID);
        return {
          ...field,
          enumOptions: options.map(opt => opt.optionValue)
        };
      }
      return field;
    }));

    res.json(fieldsWithOptions);
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({ error: "Database query error" });
  }
});

/**
 * GET /api/field/enum-options
 * 
 * Retrieves all field enum options from the FieldEnumOptions table.
 */
router.get('/field/enum-options', async (req, res) => {
  try {
    const enumOptions = await db("FieldEnumOptions").select("*");
    res.json(enumOptions);
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({ error: "Database query error" });
  }
});

/**
 * POST /api/addition/field
 * 
 * Creates a new field.
 * 
 * Request Body:
 * - assetTypeName: The name of the asset type to associate with the field
 * - fieldName: The name of the new field
 * - fieldType: The type of the field (Double, String, Boolean)
 * - units: Optional. The units for the field
 * - enumOptions: Optional. The options for the field if it is an Enum
 */
router.post('/addition/field', async (req, res) => {
  const { assetTypeName, fieldName, fieldType, units, enumOptions } = req.body;
  console.log("Received data:", { assetTypeName, fieldName, fieldType, units, enumOptions });

  // Validate fieldType
  if (!fieldType || !['Double', 'String', 'Boolean', 'Enum'].includes(fieldType)) {
    console.error("Invalid fieldType:", fieldType);
    res.status(400).json({ 
      error: "Invalid or missing fieldType", 
      message: "fieldType must be one of: Double, String, Boolean, Enum",
      receivedType: fieldType
    });
    return;
  }

  // Validate enumOptions if fieldType is Enum
  if (fieldType === 'Enum' && (!enumOptions || !Array.isArray(enumOptions) || enumOptions.length === 0)) {
    console.error("Invalid enumOptions:", enumOptions);
    res.status(400).json({
      error: "Invalid enumOptions",
      message: "Enum fields must have at least one option",
      receivedOptions: enumOptions
    });
    return;
  }

  try {
    const rows = await db("AssetType")
      .select("assetTypeID")
      .where("name", assetTypeName);

    if (rows.length === 0) {
      console.error("AssetType not found:", assetTypeName);
      res.status(404).json({ error: "AssetType not found", receivedName: assetTypeName });
      return;
    }

    const assetTypeID = rows[0].assetTypeID;

    // Start a transaction since we might need to insert both field and enum options
    // Transactions allow us to roll back multiple operations as a single unit
    const trx = await db.transaction();

    try {
      // Insert the field
      const [fieldId] = await trx("Field").insert({
        fieldName: fieldName,
        assetTypeID,
        fieldType,
        units,
      });

      // If it's an enum field, insert the options
      if (fieldType === 'Enum' && enumOptions) {
        const enumOptionsToInsert = enumOptions.map((option: string) => ({
          fieldID: fieldId,
          optionValue: option
        }));

        await trx("FieldEnumOptions").insert(enumOptionsToInsert);
      }

      await trx.commit();
      res.json({ message: "Field inserted successfully", fieldId });
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Database insert error", details: error });
  }
});

/**
 * DELETE /api/field/:id
 * 
 * Deletes a field by ID.
 * 
 * URL Parameters:
 * - id: The ID of the field to delete
 */
router.delete('/field/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // db will cascade delete
    // try deleting the field
    await db("Field").where("fieldID", id).delete();
    res.status(200).json({ message: "Field deleted successfully" });
  } catch (error) {
    console.error("Database delete error:", error);
    res.status(500).json({ error: "Database delete error" });
  }
});

/**
 * PUT /api/field/:id
 * 
 * Updates a field by ID.
 * 
 * URL Parameters:
 * - id: The ID of the field to update
 * 
 * Request Body:
 * - newFieldName: The new name for the field
 * - newFieldType: The new type for the field (Double, String, Boolean, Enum) -- currently this cannot be changed
 * - newUnits: Optional. The new units for the field
 */
router.put('/field/:id', async (req, res) => {
  const { id } = req.params;
  const { newFieldName, newFieldType, newUnits, newEnumOptions } = req.body;

  if (!newFieldName || !newFieldType || !['Double', 'String', 'Boolean', 'Enum'].includes(newFieldType)) {
    res.status(400).json({ 
      error: "newFieldName and valid newFieldType are required",
      message: "newFieldType must be one of: Double, String, Boolean, Enum"
    });
    return;
  }

  // Validate enumOptions if fieldType is Enum
  if (newFieldType === 'Enum' && (!newEnumOptions || !Array.isArray(newEnumOptions) || newEnumOptions.length === 0)) {
    res.status(400).json({
      error: "Invalid enumOptions",
      message: "Enum fields must have at least one option",
      receivedOptions: newEnumOptions
    });
    return;
  }

  try {
    // Start a transaction since we might need to update both field and enum options
    const trx = await db.transaction();

    try {
      const updateData: any = { 
        fieldName: newFieldName, 
        fieldType: newFieldType 
      };
      if (newUnits !== undefined) updateData.units = newUnits;

      const result = await trx("Field")
        .where("fieldID", id)
        .update(updateData);
      
      if (result === 0) {
        await trx.rollback();
        res.status(404).json({ error: "Field not found" });
        return;
      }

      // If it's an enum field, update the options
      if (newFieldType === 'Enum' && newEnumOptions) {
        // First delete existing options
        await trx("FieldEnumOptions")
          .where("fieldID", id)
          .delete();

        // Then insert new options
        const enumOptionsToInsert = newEnumOptions.map((option: string) => ({
          fieldID: id,
          optionValue: option
        }));

        await trx("FieldEnumOptions").insert(enumOptionsToInsert);
      }

      await trx.commit();
      res.json({ message: "Field updated successfully" });
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Database update error:", error);
    res.status(500).json({ error: "Database update error" });
  }
});

export default router; 