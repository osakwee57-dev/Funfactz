
import { GoogleGenAI, Type } from "@google/genai";
import { Category, FunFact } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function fetchAIFunFact(categories: Category[]): Promise<FunFact | null> {
  try {
    const categoryList = categories.join(", ");
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Give me one interesting, short fun fact related to any of these categories: ${categoryList}. Make it engaging and surprising.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fact: { type: Type.STRING },
            category: { type: Type.STRING, description: "Must be one of: " + categoryList }
          },
          required: ["fact", "category"]
        }
      }
    });

    const data = JSON.parse(response.text);
    return {
      id: Date.now().toString(),
      fact: data.fact,
      category: data.category as Category
    };
  } catch (error) {
    console.error("Error fetching AI fun fact:", error);
    return null;
  }
}
