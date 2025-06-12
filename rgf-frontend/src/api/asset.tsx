import axios, { AxiosResponse } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Types
interface Asset {
  assetID: number;
  assetTypeID: number;
  assetTypeName: string;
}

interface AssetWithEntries {
  asset: Asset;
  fields: Field[];
  entries: {
    double: EntryInt[];
    boolean: EntryBool[];
    text: EntryText[];
  };
}

interface Field {
  fieldID: number;
  fieldName: string;
  assetTypeID: number;
  fieldType: "Double" | "Boolean" | "String";
}

interface EntryInt {
  entryID: number;
  fieldID: number;
  assetID: number;
  value: number;
  date: string;
  fieldName: string;
  fieldType: string;
}

interface EntryBool {
  entryID: number;
  fieldID: number;
  assetID: number;
  trueFalse: boolean;
  date: string;
  fieldName: string;
  fieldType: string;
}

interface EntryText {
  entryID: number;
  fieldID: number;
  assetID: number;
  text: string;
  date: string;
  fieldName: string;
  fieldType: string;
}

interface EntryInput {
  fieldID: number;
  value: number | boolean | string;
  date?: string;
}

interface AddEntryResponse {
  message: string;
  assetID: number;
  assetTypeID: number;
  assetTypeName: string;
  date: string;
  successfulEntries: {
    fieldID: number;
    entryID: number;
    tableName: string;
    fieldType: string;
    success: boolean;
  }[];
  failedEntries?: {
    fieldID: number;
    error: string;
  }[];
}

// API Functions
export const fetchAssets = async (): Promise<Asset[]> => {
  try {
    const response: AxiosResponse<Asset[]> = await api.get("/asset");
    return response.data;
  } catch (error) {
    console.error("Error fetching assets:", error);
    throw error;
  }
};

export const fetchAssetById = async (assetId: number): Promise<AssetWithEntries> => {
  try {
    const response: AxiosResponse<AssetWithEntries> = await api.get(`/asset/${assetId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching asset with ID ${assetId}:`, error);
    throw error;
  }
};

export const addAssetWithEntries = async (
  assetTypeName: string,
  entries: EntryInput[]
): Promise<AddEntryResponse> => {
  try {
    const response: AxiosResponse<AddEntryResponse> = await api.post("/addition/entry", {
      assetTypeName,
      entries,
    });
    return response.data;
  } catch (error) {
    console.error("Error adding asset with entries:", error);
    throw error;
  }
};

// Helper function to create an entry input object
export const createEntryInput = (
  fieldID: number, 
  value: number | boolean | string,
  date?: string
): EntryInput => {
  return { fieldID, value, date };
}; 