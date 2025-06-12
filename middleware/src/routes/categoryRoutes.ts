
import express from "express";
import { db } from "../config/dbConnection";

// Create a router instance for managing routes
const router = express.Router();

/**
 * GET /api/Category
 * 
 * Endpoint for retrieving all categories.
 * 
 * Response will include all categories in the database.
 */
router.get("/Category", async (req, res) => {
  try {
    const rows = await db("Category").select("*");
    res.json(rows);
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({ error: "Database query error" });
  }
});

/**
 * POST /api/addition/category
 * 
 * Endpoint for creating a new category.
 * 
 * Request body should contain a "column2" field with the category name.
 * Response will include the result of the insertion.
 */
router.post("/addition/category", async (req, res) => {
  const { column2 } = req.body; // Only get categoryName
  console.log("Received data:", { categoryName: column2 });

  try {
    const result = await db("Category").insert({ categoryName: column2 });
    console.log("Insert result:", result);
    res.json({ message: "Category inserted successfully", result });
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Database insert error", details: error });
  }
});

/**
 * DELETE /api/category/:id
 * 
 * Endpoint for deleting a category by ID.
 * 
 * URL parameter should contain the category ID to delete.
 * Response will indicate success or failure of the deletion.
 */
router.delete("/category/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // db will cascade delete
    // try deleting the category
    await db("Category").where("categoryID", id).delete();
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Database delete error:", error);
    res.status(500).json({ error: "Database delete error" });
  }
});

/**
 * PUT /api/category/:id
 * 
 * Endpoint for updating a category by ID.
 * 
 * URL parameter should contain the category ID to update.
 * Request body should contain a "newCategoryName" field with the new name.
 * Response will indicate success or failure of the update.
 */
router.put("/category/:id", async (req, res) => {
  const { id } = req.params;
  const { newCategoryName } = req.body;

  if (!newCategoryName) {
    res.status(400).json({ error: "newCategoryName is required" });
    return;
  }

  try {
    const result = await db("Category")
      .where("categoryID", id)
      .update({ categoryName: newCategoryName });
    
    if (result === 0) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    
    res.json({ message: "Category updated successfully" });
  } catch (error) {
    console.error("Database update error:", error);
    res.status(500).json({ error: "Database update error" });
  }
});

export default router; 
