
import { GoogleGenAI, Type } from '@google/genai';
import type { IAIEngine } from '../core/interfaces';
import type { Recipe } from '../types';

const RECIPE_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      description: { type: Type.STRING },
      difficulty: { type: Type.STRING },
      prepTime: { type: Type.INTEGER },
      calories: { type: Type.INTEGER },
      servings: { type: Type.INTEGER },
      dietaryTags: { type: Type.ARRAY, items: { type: Type.STRING } },
      ingredients: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            quantity: { type: Type.NUMBER },
            unit: { type: Type.STRING },
            category: { type: Type.STRING },
            isPresent: { type: Type.BOOLEAN },
          },
          required: ['name', 'quantity', 'unit', 'category', 'isPresent'],
        },
      },
      instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ['name', 'description', 'difficulty', 'prepTime', 'calories', 'servings', 'ingredients', 'instructions'],
  },
};

export class GeminiAIEngine implements IAIEngine {
  private getClient() {
    const storedKey = localStorage.getItem('user_gemini_api_key');
    const apiKey = storedKey || process.env.API_KEY;
    if (!apiKey) throw new Error("Missing API Key.");
    return new GoogleGenAI({ apiKey });
  }

  async analyzeImage(base64Image: string): Promise<Recipe[]> {
    const prompt = `Analyze fridge image. Identify edible items. Generate 3 diverse recipes. Default servings: 2. Categories: [Produce, Dairy, Meat, Seafood, Pantry, Spices, Bakery, Other]. isPresent=true if visible.`;
    
    const response = await this.getClient().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: RECIPE_SCHEMA,
      }
    });

    return JSON.parse(response.text || '[]');
  }

  async generateRecipesFromIngredients(ingredients: string[]): Promise<Recipe[]> {
    const prompt = `Create 3 recipes using: ${ingredients.join(', ')}. Assume pantry staples.`;
    
    const response = await this.getClient().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { text: prompt },
      config: {
        responseMimeType: "application/json",
        responseSchema: RECIPE_SCHEMA,
      }
    });

    return JSON.parse(response.text || '[]');
  }

  async generateRecipeImage(name: string, description: string): Promise<string[]> {
    try {
        const prompt = `Professional food photography of "${name}". ${description}. 4k, appetizing.`;
        const response = await this.getClient().models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: '16:9' } },
        });

        return response.candidates?.[0]?.content?.parts
            ?.filter(p => p.inlineData)
            .map(p => `data:${p.inlineData!.mimeType};base64,${p.inlineData!.data}`) || [];
    } catch (e) {
        console.warn('Image gen failed', e);
        return [];
    }
  }
}
