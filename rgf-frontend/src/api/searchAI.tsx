import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interface for the asset data with entries
interface AssetWithEntries {
    assetID: number;
    boolFields: string | null;
    textFields: string | null;
    intFields: string | null;
}

// Interface for the search response that includes both assets and DSL query
interface SearchResponse {
    assets: AssetWithEntries[];
    dslQuery: string;
    assetTypeID?: number;
    assetTypeName?: string;
}

export const searchAI = async (text: string, useAI: boolean = true): Promise<SearchResponse> => {
  try {
    // Choose endpoint based on whether AI is being used
    const endpoint = useAI ? '/nlquery' : '/dslquery';
    
    const response = await api.get(endpoint, {
      params: { query: text }
    });
    
    // Check if the response is in the new format with assets and dslQuery
    // If not, convert it to the new format for backward compatibility
    if (response.data && response.data.assets && response.data.dslQuery) {
      return response.data;
    } else {
      // Handle the case where the server returns the old format (just assets array)
      return {
        assets: Array.isArray(response.data) ? response.data : [response.data],
        dslQuery: "Query processed (DSL not available)"
      };
    }
  } catch (error) {
    console.error("Error performing search:", error);
    
    // Create an error object that can include the DSL query if available
    let errorInfo: { message: string; dslQuery?: string } = { 
      message: "An error occurred during search" 
    };
    
    // Extract the detailed error message and DSL query from the server response if available
    if (axios.isAxiosError(error)) {
      if (error.response?.data) {
        const serverError = error.response.data;
        
        // Extract DSL query if present in the error response
        if (serverError.dslQuery) {
          errorInfo.dslQuery = serverError.dslQuery;
        }
        
        // Extract the error message
        if (serverError.message) {
          errorInfo.message = serverError.message;
        } else if (serverError.error) {
          errorInfo.message = `${serverError.error}${serverError.message ? `: ${serverError.message}` : ''}`;
        }
      }
      // If we have a response status but no extracted message
      if (error.response && !errorInfo.message) {
        errorInfo.message = `Request failed with status code ${error.response.status}: ${error.message}`;
      }
    } else if (error instanceof Error) {
      errorInfo.message = error.message;
    }
    
    // Throw the enhanced error object
    throw errorInfo;
  }
};