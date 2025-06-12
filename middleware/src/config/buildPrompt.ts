import { NL_TO_DSL_PROMPT } from "./prompts";
import { loadPromptContext } from "./loadPromptContext";

export async function buildPromptWithContext(): Promise<string> {
  const context = await loadPromptContext();
  if (!context) {
    throw new Error("Failed to load DSL context");
  }

  const { categories, assetTypes, fields } = context;

  return `
${NL_TO_DSL_PROMPT}

Context Data:
Categories: ${categories.join(", ")}
Groups: ${assetTypes.join(", ")}
Fields: ${fields.join(", ")}`
}
