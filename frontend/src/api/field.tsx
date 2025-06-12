import axios, { AxiosResponse } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

interface Field {
  fieldID: number;
  fieldName: string;
  assetTypeID: number;
  fieldType: string;
  units: string;
  enumOptions?: string[];
}

interface FieldEnumOption {
  fieldID: number;
  optionValue: string;
}

// Define valid field types
type ValidFieldType = 'Double' | 'String' | 'Boolean' | 'Enum';

export const fetchField = async (assetTypeID?: number): Promise<Field[]> => {
  try {
    const url = assetTypeID ? `/field?assetTypeID=${assetTypeID}` : "/field";
    const response: AxiosResponse<Field[]> = await api.get(url);
    console.log("Fields response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching fields:", error);
    throw error;
  }
};

export const fetchAllFieldEnumOptions = async (): Promise<FieldEnumOption[]> => {
  try {
    const response: AxiosResponse<FieldEnumOption[]> = await api.get("/field/enum-options");
    console.log("Field enum options response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching field enum options:", error);
    throw error;
  }
};

export const addField = async (
  assetTypeName: string, 
  fieldName: string, 
  fieldType: ValidFieldType, 
  units: string,
  enumOptions?: string[]
): Promise<Field> => {
  try {
    const requestData = {
      assetTypeName: assetTypeName,
      fieldName: fieldName,
      fieldType: fieldType,
      units: units,
      enumOptions: enumOptions,
    };
    
    const response: AxiosResponse<Field> = await api.post("/addition/field", requestData);
    console.log("Field added successfully:", response.data);
    return response.data;

  } catch (error) {
    console.error("Error adding field:", error);
    
    if (axios.isAxiosError(error) && error.response) {
      console.error("Server response:", error.response.data);
    }
    throw error;
  }
};