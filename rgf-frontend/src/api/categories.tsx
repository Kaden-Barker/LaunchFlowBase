import axios, { AxiosResponse } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

interface Category {
  categoryID: number;
  categoryName: string;
}

export const fetchCategories = async (): Promise<Category[]> => {
  try {
    const response: AxiosResponse<Category[]> = await api.get("/Category");
    return response.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

export const addCategory = async (categoryName: string): Promise<Category> => {
    try {
      const response: AxiosResponse<Category> = await api.post("/addition/category", {
        column2: categoryName, // Only send categoryName
      });
      return response.data;
    } catch (error) {
      console.error("Error adding category:", error);
      throw error;
    }
  };
  
