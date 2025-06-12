import axios, { AxiosResponse } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

interface AssetType {
  assetTypeID: number;
  categoryID: number;
  name: string;
}

export const fetchAssetType = async (categoryID?: number): Promise<AssetType[]> => {
  try {
    const url = categoryID ? `/assettype?categoryID=${categoryID}` : "/assettype";
    console.log("Fetching asset types with URL:", url, "Category ID:", categoryID);
    const response: AxiosResponse<AssetType[]> = await api.get(url);
    console.log("Asset types response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching AssetType:", error);
    throw error;
  }
};

export const addAssetType= async (categoryName: string, assetTypeName: string): Promise<AssetType> => {
    try {
      const response: AxiosResponse<AssetType> = await api.post("/addition/assettype", {
        column2: categoryName, // Only send categoryName
        column3: assetTypeName,
      });
      return response.data;
    } catch (error) {
      console.error("Error adding assetType:", error);
      throw error;
    }
  };
  
