// utils/normalizeData.ts

// Utility functions for space/underscore conversion
// For consistent storage and retrieval
export const normalizeStringStorage = (str: string): string => 
    str.trim()
      .replace(/[\s_]+/g, '_')  // Collapse multiple spaces or underscores into one underscore
      .toLowerCase();
  
  // Normalize for Displaying
export const normalizeStringDisplay = (str: string): string =>
  str.replace(/_/g, ' ') // Convert underscores to spaces first
      .replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()); // converting to title case test_test -> Test Test
    