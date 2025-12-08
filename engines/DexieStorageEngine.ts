
import { db } from '../db'; // Keep the low-level DB definition, wrap it here
import type { IStorageEngine } from '../core/interfaces';
import type { User, Recipe, ShoppingListItem } from '../types';

export class DexieStorageEngine implements IStorageEngine {
  users = {
    get: (id: number) => db.users.get(id),
    getAll: () => db.users.toArray(),
    add: (user: User) => db.users.add(user) as Promise<number>,
    update: (id: number, updates: Partial<User>) => db.users.update(id, updates),
    delete: (id: number) => db.users.delete(id),
  };

  recipes = {
    getQuery: (userId: number) => () => db.recipes.where('[userId+isFavorite]').equals([userId, 1]).toArray(),
    add: (recipe: Recipe) => db.recipes.add(recipe) as Promise<number>,
    delete: (id: number) => db.recipes.delete(id),
    deleteAll: (userId: number) => db.recipes.where('userId').equals(userId).delete().then(() => {}),
    toggleFavorite: async (userId: number, recipe: Recipe) => {
        const existing = await db.recipes.where({ userId, name: recipe.name, isFavorite: 1 }).first();
        if (existing) {
            await db.recipes.delete(existing.id!);
            return false; // Removed
        } else {
            await db.recipes.add({ ...recipe, userId, isFavorite: true, createdAt: Date.now() });
            return true; // Added
        }
    }
  };

  shoppingList = {
    getQuery: (userId: number) => () => db.shoppingList.where('userId').equals(userId).toArray(),
    add: async (item: ShoppingListItem) => {
        const exists = await db.shoppingList.where({ userId: item.userId, text: item.text }).first();
        if (exists) return exists.id as number;
        return await db.shoppingList.add(item) as number;
    },
    update: (id: number, updates: Partial<ShoppingListItem>) => db.shoppingList.update(id, updates),
    delete: (id: number) => db.shoppingList.delete(id),
    deleteAll: (userId: number) => db.shoppingList.where('userId').equals(userId).delete().then(() => {}),
    toggleCheck: async (id: number) => {
        const item = await db.shoppingList.get(id);
        if (item) await db.shoppingList.update(id, { checked: !item.checked });
    },
    uncheckAll: (userId: number) => db.shoppingList.where('userId').equals(userId).modify({ checked: false }).then(() => {}),
  };
}
