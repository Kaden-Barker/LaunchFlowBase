import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Update Category
export const updateCategory = async (categoryID: number, newCategoryName: string): Promise<void> => {
  try {
    await api.put(`/category/${categoryID}`, { newCategoryName });
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
};

// Update Asset Type
export const updateAssetType = async (assetTypeID: number, newName: string): Promise<void> => {
  try {
    await api.put(`/assettype/${assetTypeID}`, { newName });
  } catch (error) {
    console.error("Error updating asset type:", error);
    throw error;
  }
};

// Update Field
export const updateField = async (
  fieldID: number,
  newFieldName: string,
  newFieldType: 'Double' | 'String' | 'Boolean' | 'Enum',
  newUnits?: string,
  newEnumOptions?: string[]
): Promise<void> => {
  try {
    await api.put(`/field/${fieldID}`, {
      newFieldName,
      newFieldType,
      newUnits,
      newEnumOptions
    });
  } catch (error) {
    console.error("Error updating field:", error);
    throw error;
  }
};

// Update EntryInt
export const updateEntryInt = async (
  entryID: number,
  newValue: number,
  date: string
): Promise<void> => {
  try {
    await api.put(`/entryint/${entryID}`, {
      newValue,
      date
    });
  } catch (error) {
    console.error("Error updating integer entry:", error);
    throw error;
  }
};

// Update EntryBool
export const updateEntryBool = async (
  entryID: number,
  newTrueFalse: boolean,
  date: string
): Promise<void> => {
  try {
    await api.put(`/entrybool/${entryID}`, {
      newTrueFalse,
      date
    });
  } catch (error) {
    console.error("Error updating boolean entry:", error);
    throw error;
  }
};

// Update EntryText
export const updateEntryText = async (
  entryID: number,
  newText: string,
  date: string
): Promise<void> => {
  try {
    await api.put(`/entrytext/${entryID}`, {
      newText,
      date
    });
  } catch (error) {
    console.error("Error updating text entry:", error);
    throw error;
  }
}; 