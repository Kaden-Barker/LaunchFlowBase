import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});


// Delete Category 
export const deleteCategory = async (categoryID: number): Promise<void> => {
  try {
    await api.delete(`/category/${categoryID}`); // calls the delete route on the middleware
  } catch (error) {
    console.error("Error deleting category:", error);
  }
};

// Delete Asset Type
export const deleteAssetType = async (assetTypeID: number): Promise<void> => {
  try {
    await api.delete(`/assettype/${assetTypeID}`);
  } catch (error) {
    console.error("Error deleting asset type:", error);
  }
};

// Delete Field
// the Enum options are deleted automatically when the corresponding field is deleted
export const deleteField = async (fieldID: number): Promise<void> => {
  try {
    await api.delete(`/field/${fieldID}`);
  } catch (error) {
    console.error("Error deleting field:", error);
  }
};

// Delete Asset
export const deleteAsset = async (assetID: number): Promise<void> => {
  try {
    await api.delete(`/asset/${assetID}`);
  } catch (error) {
    console.error("Error deleting asset:", error);
  }
};
