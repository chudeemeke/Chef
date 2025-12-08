
import { GoogleGenAI, Type } from '@google/genai';
import type { Recipe } from '../types';

// Helper to get the AI instance dynamically
const getAI = () => {
    // Check local storage first (User entered key), then environment variable
    const storedKey = localStorage.getItem('user_gemini_api_key');
    const apiKey = storedKey || process.env.API_KEY;

    if (!apiKey) {
        throw new Error("Missing API Key. Please add your Gemini API Key in the Profile settings.");
    }

    return new GoogleGenAI({ apiKey });
};

const recipeSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: 'The name of the dish.' },
      description: { type: Type.STRING, description: 'A short, enticing description.' },
      difficulty: { type: Type.STRING, description: "A rating from 'Easy', 'Medium', or 'Hard'." },
      prepTime: { type: Type.INTEGER, description: 'Estimated preparation and cooking time in minutes.' },
      calories: { type: Type.INTEGER, description: 'Estimated calories per serving.' },
      servings: { type: Type.INTEGER, description: 'The default number of servings this recipe yields.'},
      dietaryTags: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "An array of dietary classifications like 'Vegetarian', 'Keto', etc."
      },
      ingredients: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            quantity: { type: Type.NUMBER, description: 'The numeric value for the quantity.' },
            unit: { type: Type.STRING },
            category: { type: Type.STRING, description: 'The general category of the ingredient: Produce, Dairy, Meat, Seafood, Pantry, Spices, Bakery, or Other.' },
            isPresent: { type: Type.BOOLEAN, description: 'True if the ingredient is visible in the fridge.' },
          },
          required: ['name', 'quantity', 'unit', 'category', 'isPresent'],
        },
      },
      instructions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'An array of strings, each being one step of the recipe.',
      },
    },
    required: ['name', 'description', 'difficulty', 'prepTime', 'calories', 'servings', 'dietaryTags', 'ingredients', 'instructions'],
  },
};

const handleGeminiError = (error: any): never => {
    console.error("Gemini API Error:", error);
    const msg = error.message || '';
    
    if (msg.includes('Missing API Key')) {
        throw error; // Re-throw generic missing key error
    }
    if (msg.includes('429') || msg.includes('quota')) {
        throw new Error("API usage limit exceeded. Please try again later.");
    }
    if (msg.includes('400') || msg.includes('InvalidArgument')) {
        throw new Error("The image could not be processed. Please try a different photo.");
    }
    if (msg.includes('500') || msg.includes('503')) {
        throw new Error("Service currently unavailable. Please check your internet connection or try again later.");
    }
    if (msg.includes('SAFETY')) {
        throw new Error("The content was flagged by safety filters. Please try a different image.");
    }
    
    throw new Error("Failed to generate recipes. Please try again.");
};

export const getRecipesFromImage = async (base64Image: string): Promise<Recipe[]> => {
  const prompt = `
    You are an expert culinary assistant. Analyze the fridge image and suggest recipes.

    **Step 1: Ingredient Identification**
    Identify edible items: produce, dairy, meats, drinks, jars, sauces. Guess if obscured.

    **Step 2: Recipe Generation**
    Generate 3 diverse recipes.
    - Default 'servings': 2 or 4.
    - 'category': Must be one of [Produce, Dairy, Meat, Seafood, Pantry, Spices, Bakery, Other].
    - 'isPresent': true if visible, false otherwise (assume basic pantry staples are true).
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: recipeSchema,
      }
    });
    
    if (!response.text) throw new Error("Empty response from AI");
    
    const jsonText = response.text.trim();
    const recipes: Recipe[] = JSON.parse(jsonText);
    return recipes;

  } catch (error) {
    handleGeminiError(error);
    return []; // Should not reach here due to handleGeminiError throwing
  }
};

export const generateRecipesFromIngredients = async (ingredients: string[]): Promise<Recipe[]> => {
  const prompt = `
    You are an expert chef. Create 3 diverse and delicious recipes using: ${ingredients.join(', ')}.
    - Assume basic pantry staples exist.
    - 'category': Must be one of [Produce, Dairy, Meat, Seafood, Pantry, Spices, Bakery, Other].
    - Mark 'isPresent' as true for provided ingredients.
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { text: prompt },
      config: {
        responseMimeType: "application/json",
        responseSchema: recipeSchema,
      }
    });
    
    if (!response.text) throw new Error("Empty response from AI");

    const jsonText = response.text.trim();
    const recipes: Recipe[] = JSON.parse(jsonText);
    return recipes;

  } catch (error) {
    handleGeminiError(error);
    return [];
  }
};


export const generateRecipeImage = async (recipeName: string, recipeDescription: string): Promise<string[]> => {
    try {
        const ai = getAI();
        const prompt = `Professional food photography of "${recipeName}". ${recipeDescription}. Appetizing, well-lit, shallow depth of field, high resolution, 4k.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }]
            },
            config: {
                imageConfig: {
                    aspectRatio: '16:9',
                },
            },
        });

        const images: string[] = [];
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    images.push(`data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`);
                }
            }
        }

        if (images.length > 0) {
            return images;
        }
        
        console.warn('Image generation returned no images for:', recipeName);
        return [];
    } catch (error) {
        console.error(`Error generating recipe image for "${recipeName}":`, error);
        return []; 
    }
};
