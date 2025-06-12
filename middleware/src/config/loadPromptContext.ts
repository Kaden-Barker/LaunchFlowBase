import axios from "axios";
import dotenv from "dotenv";

// Configure dotenv to load environment variables
dotenv.config();

const API_URL = process.env.API_URL;

export async function loadPromptContext() {
  if (!API_URL) {
    console.error("API_URL environment variable is not defined");
    return null;
  }

  try {
    const [categoriesRes, assetTypesRes, fieldsRes] = await Promise.all([
      axios.get(`${API_URL}/Category`),
      axios.get(`${API_URL}/assettype`),
      axios.get(`${API_URL}/field`),
    ]);

    const categories = categoriesRes.data.map((c: any) => c.categoryName.toLowerCase());
    const assetTypes = assetTypesRes.data.map((a: any) => a.name.toLowerCase());
    const fields = fieldsRes.data.map((f: any) => f.fieldName.toLowerCase());

    return { categories, assetTypes, fields };
  } catch (err) {
    console.error("Error loading prompt context:", err);
    return null;
  }
}
