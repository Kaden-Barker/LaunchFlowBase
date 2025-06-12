/**
 * Change Log Routes
 * 
 * This module defines the API routes for managing change logs,
 * including retrieving and creating change log entries.
 */

import express, { Request, Response } from 'express';
import { db } from '../config/dbConnection';

const router = express.Router();

/**
 * GET /api/change-log
 * 
 * Retrieves all change log entries.
 */
router.get('/change-log', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 25;
    const logs = await db("ChangeLog")
      .select("*")
      .orderBy("timestamp", "desc")
      .limit(limit);
    res.json(logs);
  } catch (error) {
    console.error("Error fetching change logs:", error);
    res.status(500).json({ error: "Error fetching change logs" });
  }
});

/**
 * POST /api/change-log
 * 
 * Creates a new change log entry.
 * 
 * Request Body:
 * - userEmail: The email of the user making the change
 * - action: The action performed (e.g., 'INSERT', 'UPDATE', 'DELETE')
 * - changeDetails: Optional. Object describing the changes made
 */
router.post('/change-log', async (req, res) => {
  try {
    const { userEmail, action, changeDetails } = req.body;
    
    if (!userEmail || !action) {
      res.status(400).json({ error: "userEmail and action are required" });
      return;
    }

    const result = await db("ChangeLog").insert({
      userEmail,
      action,
      changeDetails: changeDetails || null
    });

    res.status(201).json({ message: "Change logged successfully", id: result[0] });
  } catch (error) {
    console.error("Error logging change:", error);
    res.status(500).json({ error: "Error logging change" });
  }
});

export default router; 