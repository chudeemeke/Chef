
import type { Recipe, User, ShoppingListItem, ShareData } from '../types';

export interface IAIEngine {
  analyzeImage(base64Image: string): Promise<Recipe[]>;
  generateRecipesFromIngredients(ingredients: string[]): Promise<Recipe[]>;
  generateRecipeImage(name: string, description: string): Promise<string[]>;
}

export interface IStorageEngine {
  users: {
    get(id: number): Promise<User | undefined>;
    getAll(): Promise<User[]>;
    add(user: User): Promise<number>;
    update(id: number, updates: Partial<User>): Promise<number>;
    delete(id: number): Promise<void>;
  };
  recipes: {
    getQuery(userId: number): () => Promise<Recipe[]>; // For useLiveQuery
    add(recipe: Recipe): Promise<number>;
    delete(id: number): Promise<void>;
    deleteAll(userId: number): Promise<void>;
    toggleFavorite(userId: number, recipe: Recipe): Promise<boolean>; // Returns new state
  };
  shoppingList: {
    getQuery(userId: number): () => Promise<ShoppingListItem[]>; // For useLiveQuery
    add(item: ShoppingListItem): Promise<number>;
    update(id: number, updates: Partial<ShoppingListItem>): Promise<number>;
    delete(id: number): Promise<void>;
    deleteAll(userId: number): Promise<void>;
    toggleCheck(id: number): Promise<void>;
    uncheckAll(userId: number): Promise<void>;
  };
}

export interface ISharingEngine {
  share(data: ShareData): Promise<{ success: boolean; method: string }>;
}
