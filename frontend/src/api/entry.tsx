import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Create EntryInt
export const createEntryInt = async (
  assetID: number,
  fieldID: number,
  value: number,
  date: string
): Promise<void> => {
  try {
    await api.post('/entryint', {
      assetID,
      fieldID,
      value,
      date
    });
  } catch (error) {
    console.error("Error creating integer entry:", error);
    throw error;
  }
};

// Create EntryBool
export const createEntryBool = async (
  assetID: number,
  fieldID: number,
  trueFalse: boolean,
  date: string
): Promise<void> => {
  try {
    await api.post('/entrybool', {
      assetID,
      fieldID,
      trueFalse,
      date
    });
  } catch (error) {
    console.error("Error creating boolean entry:", error);
    throw error;
  }
};

// Create EntryText
export const createEntryText = async (
  assetID: number,
  fieldID: number,
  text: string,
  date: string
): Promise<void> => {
  try {
    await api.post('/entrytext', {
      assetID,
      fieldID,
      text,
      date
    });
  } catch (error) {
    console.error("Error creating text entry:", error);
    throw error;
  }
}; 