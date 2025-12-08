
export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  isPresent: boolean;
}

export interface UserPreferences {
  darkMode: boolean;
  dietaryFilters: string[];
  difficultyFilters?: string[];
  currency?: string; // e.g., '$', '€', '£'
}

export interface User {
  id?: number;
  name: string;
  avatar: string; // Emoji
  preferences: UserPreferences;
  createdAt: number;
}

export interface ShoppingListItem {
  id?: number | string; // DB uses number, local might use string temporarily
  userId?: number;
  text: string;
  category: string;
  checked: boolean;
  price?: number;
  ingredient?: Ingredient; 
  quantity?: number;
  unit?: string;
}

export interface Timer {
  id: number;
  label: string;
  initialDuration: number; 
  remainingSeconds: number;
  isRunning: boolean;
}

export interface Recipe {
  id?: number;
  userId?: number;
  isFavorite?: boolean; // Helper for DB querying
  name:string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  prepTime: number;
  calories: number;
  servings: number;
  dietaryTags: string[];
  ingredients: Ingredient[];
  instructions: string[];
  imageUrls?: string[];
  createdAt?: number;
}

// --- Sharing Framework Types ---
export interface ShareData {
  title: string;
  text: string;
  url?: string;
}

export interface IShareStrategy {
  isSupported(): boolean;
  share(data: ShareData): Promise<void>;
}
