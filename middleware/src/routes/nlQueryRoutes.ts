/**
 * Natural Language Query Routes
 * 
 * This module defines the API routes for natural language processing,
 * allowing users to submit queries in plain English and receive
 * structured DSL (Domain-Specific Language) responses.
 */

import express, { Request, Response } from "express";
import { convertNaturalLanguageToDSL } from "../ai/openaiService";
import { DSLParser } from "../config/DSLParser";
import { getAssetsByType } from "./assetRoutes";
import { db } from "../config/dbConnection";

// Create a router instance for managing routes
const router = express.Router();

/**
 * GET /api/nlquery
 * 
 * Endpoint for processing natural language queries and returning matching assets.
 * 
 * Query Parameters:
 * - query: The natural language query string
 */
router.get("/nlquery", async (req: Request, res: Response) => {
  try {
    // Extract query from URL parameters for GET request
    const query = req.query.query as string;
    
    // Validate the query parameter
    if (!query || typeof query !== 'string') {
      res.status(400).json({
        error: "Missing or invalid query",
        message: "Please provide a natural language query string as a query parameter"
      });
      return;
    }

    // Log the incoming query for debugging
    console.log("Processing natural language query:", query);
    
    // Convert the natural language query to DSL syntax
    const { dslQuery } = await convertNaturalLanguageToDSL(query);
    
    // Log the generated DSL query for debugging
    console.log("Generated DSL query:", dslQuery);
    
    // Store this in case we need it for error responses
    let generatedDslQuery = dslQuery;
    
    try {
      // Attempt to parse and execute the query
      const parseResult = DSLParser(dslQuery);

      if (!parseResult.query) {
        console.error("DSL Parse Error:", parseResult.error);
        res.status(400).json({ 
          error: "DSL Query Parse Error", 
          message: parseResult.error || "Could not parse the DSL query",
          dslQuery: generatedDslQuery 
        });
        return;
      }

      const assetType = parseResult.query.assetType;
      
      // Get the asset type ID
      const assetTypeRow = await db("AssetType")
        .select("assetTypeID")
        .where("name", assetType)
        .first();
      
      if (!assetTypeRow) {
        console.error("Asset type not found:", assetType);
        res.status(404).json({ 
          error: "AssetTypeName not found", 
          dslQuery: generatedDslQuery 
        });
        return;
      }
      
      const assetTypeID = assetTypeRow.assetTypeID.toString();
      
      // Get the assets
      const assets = await getAssetsByType(
        assetTypeID, 
        parseResult.query.field, 
        parseResult.query.value, 
        parseResult.query.operator
      );

      // Include the DSL query and assetTypeID in the response
      res.json({
        assets: assets,
        dslQuery: generatedDslQuery,
        assetTypeID: Number(assetTypeID),
        assetTypeName: assetType
      });
    } catch (innerError) {
      // This catch block handles errors after DSL generation but before completing the query
      console.error("Error processing DSL query:", innerError);
      let errorMessage = "An error occurred while processing your DSL query";
      
      if (innerError instanceof Error) {
        errorMessage = innerError.message;
      }
      
      res.status(500).json({
        error: "Query execution error", 
        message: errorMessage,
        dslQuery: generatedDslQuery // Include the DSL query even in error responses
      });
    }
  } catch (error) {
    // This is the outer catch block for errors during the initial query processing
    console.error("Error processing natural language query:", error);
    let errorMessage = "An error occurred while processing your query";
    
    // Extract more specific error message if available
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    res.status(500).json({
      error: "Server error", 
      message: errorMessage,
      // No DSL query here since it couldn't be generated
    });
  }
});

/**
 * GET /api/dslquery
 * 
 * Endpoint for processing direct DSL queries and returning matching assets.
 * This endpoint skips the AI conversion step and directly parses the DSL query.
 * 
 * Query Parameters:
 * - query: The DSL query string
 */
router.get("/dslquery", async (req: Request, res: Response) => {
  try {
    // Extract query from URL parameters for GET request
    const query = req.query.query as string;
    
    // Validate the query parameter
    if (!query || typeof query !== 'string') {
      res.status(400).json({
        error: "Missing or invalid query",
        message: "Please provide a DSL query string as a query parameter"
      });
      return;
    }

    
    try {
      // Attempt to parse and execute the query
      const parseResult = DSLParser(query);

      if (!parseResult.query) {
        console.error("DSL Parse Error:", parseResult.error);
        res.status(400).json({ 
          error: "DSL Query Parse Error", 
          message: parseResult.error || "Could not parse the DSL query",
          dslQuery: query 
        });
        return;
      }

      const assetType = parseResult.query.assetType;      
      // Get the asset type ID
      const assetTypeRow = await db("AssetType")
        .select("assetTypeID")
        .where("name", assetType)
        .first();
      
      if (!assetTypeRow) {
        console.error("Asset type not found:", assetType);
        res.status(404).json({ 
          error: "AssetTypeName not found", 
          dslQuery: query 
        });
        return;
      }
      
      const assetTypeID = assetTypeRow.assetTypeID.toString();
      
      // Get the assets
      const assets = await getAssetsByType(
        assetTypeID, 
        parseResult.query.field, 
        parseResult.query.value, 
        parseResult.query.operator
      );

      // Include the DSL query and assetTypeID in the response
      res.json({
        assets: assets,
        dslQuery: query,
        assetTypeID: Number(assetTypeID),
        assetTypeName: assetType
      });
    } catch (innerError) {
      // This catch block handles errors during query execution
      console.error("Error processing DSL query:", innerError);
      let errorMessage = "An error occurred while processing your DSL query";
      
      if (innerError instanceof Error) {
        errorMessage = innerError.message;
      }
      
      res.status(500).json({
        error: "Query execution error", 
        message: errorMessage,
        dslQuery: query // Include the original DSL query in error responses
      });
    }
  } catch (error) {
    // This is the outer catch block for errors during the initial query processing
    console.error("Error processing DSL query:", error);
    let errorMessage = "An error occurred while processing your query";
    
    // Extract more specific error message if available
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    res.status(500).json({
      error: "Server error", 
      message: errorMessage
    });
  }
});

export default router;