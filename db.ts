import Dexie, { Table } from 'dexie';
import type { User, Recipe, ShoppingListItem } from './types';

export class CulinaryDB extends Dexie {
    users!: Table<User>;
    recipes!: Table<Recipe>;
    shoppingList!: Table<ShoppingListItem>;

    constructor() {
        super('CulinaryAssistantDB');
        (this as any).version(1).stores({
            users: '++id, name',
            recipes: '++id, userId, [userId+isFavorite]', // Efficiently query user favorites
            shoppingList: '++id, userId'
        });
    }
}

export const db = new CulinaryDB();