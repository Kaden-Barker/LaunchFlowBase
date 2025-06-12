/**
 * OpenAI Service for Natural Language Processing
 * 
 * This module provides functionality to convert natural language queries into
 * a domain-specific language (DSL) format using OpenAI's API.
 */

import OpenAI from "openai";
import dotenv from "dotenv";
import { buildPromptWithContext } from "../config/buildPrompt";

// Load environment variables
dotenv.config();

// Initialize OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Converts a natural language query to domain-specific language (DSL) syntax
 * 
 * @param {string} naturalLanguageQuery - The user's natural language query (e.g., "all cattle over 200 pounds")
 * @returns {Promise<{dslQuery: string}>} - The DSL query
 */
export async function convertNaturalLanguageToDSL(naturalLanguageQuery: string): Promise<{dslQuery: string}> {
  try {
    // Dynamically build the prompt with context
    const fullPrompt = await buildPromptWithContext();

    // Create a chat completion with specific system instructions and user query
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: fullPrompt
        },
        {
          role: "user",
          content: naturalLanguageQuery
        }
      ],
      temperature: 0.1, // Low temperature for more deterministic outputs
      max_tokens: 100,  // Limit response length
    });

    // Extract the DSL query from the response
    const dslQuery = completion.choices[0]?.message?.content?.trim();
    
    if (!dslQuery) {
      console.error("OpenAI returned empty response");
      throw new Error("OpenAI service returned empty response");
    }
    
    return { dslQuery };
  } catch (error) {
    console.error("OpenAI API error:", error);
    if (error instanceof Error) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
    throw new Error("Unknown error occurred while processing natural language query");
  }
}