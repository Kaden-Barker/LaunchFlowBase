import axios, { AxiosResponse } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Modify the function to return `unknown`, allowing for flexible handling of the data type
export const fetchDataFromTable = async (
  table: string,
  filters: Record<string, string | number> = {},
  columns?: string[]  // Add optional columns parameter
): Promise<unknown> => {
  try {
    const params = { ...filters };
    if (columns) {
      params["columns"] = columns.join(","); // Send columns as a comma-separated string
    }

    const response: AxiosResponse<unknown> = await api.get(`/query/${table}`, { params });
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error(`Axios error fetching data from ${table}:`, error.message);
      if (error.response) {
        console.error(`Response status: ${error.response.status}, data:`, error.response.data);
      } else if (error.request) {
        console.error("No response received:", error.request);
      }
    } else {
      console.error("Unexpected error:", error);
    }
    throw error;
  }
};

// Interface for the asset data with entries
interface AssetWithEntries {
  assetID: number;
  boolFields: string | null;
  textFields: string | null;
  intFields: string | null;
}

// Function to fetch assets with their entries for a specific asset type
export const fetchAssetsByType = async (assetTypeID: number): Promise<AssetWithEntries[]> => {
  try {
    const response = await api.get(`/asset/type/${assetTypeID}`);
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error(`Axios error fetching assets for type ${assetTypeID}:`, error.message);
      if (error.response) {
        console.error(`Response status: ${error.response.status}, data:`, error.response.data);
      } else if (error.request) {
        console.error("No response received:", error.request);
      }
    } else {
      console.error("Unexpected error:", error);
    }
    throw error;
  }
};
