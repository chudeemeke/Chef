# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smart Fridge Chef is an AI-powered PWA that analyzes fridge photos to identify ingredients and generates recipe suggestions. Built with React 18/TypeScript, uses Google Gemini for AI capabilities and Dexie (IndexedDB) for client-side persistence.

## Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # TypeScript check + Vite production build
npm run preview   # Preview production build locally
```

## Architecture

The project follows **Hexagonal Architecture** (Ports & Adapters):

```
core/interfaces.ts     # Ports (IAIEngine, IStorageEngine, ISharingEngine)
engines/               # Adapters implementing core interfaces
  GeminiAIEngine.ts    # Google Gemini AI adapter
  DexieStorageEngine.ts # IndexedDB storage adapter
  UniversalShareEngine.ts # Native/clipboard sharing adapter
contexts/ServiceContext.tsx # Dependency injection via React Context
```

### Dependency Injection Pattern

Services are injected at the app root via `ServiceProvider` and consumed via `useServices()` hook:

```typescript
const { ai, storage, share } = useServices();
```

### Core Interfaces

**IAIEngine** - AI recipe generation:
- `analyzeImage(base64Image)` - Analyze fridge photo for ingredients
- `generateRecipesFromIngredients(ingredients[])` - Generate recipes from ingredient list
- `generateRecipeImage(name, description)` - Generate recipe images

**IStorageEngine** - Data persistence with repository-like access:
- `users.get() / .add() / .update() / .delete()`
- `recipes.getQuery() / .toggleFavorite()`
- `shoppingList.add() / .update() / .toggleCheck()`

**ISharingEngine** - Cross-platform sharing:
- `share(data)` - Native Share API with clipboard fallback

### Database Schema (Dexie)

```typescript
// db.ts
users: Table<User>           // ++id, name
recipes: Table<Recipe>       // ++id, userId, [userId+isFavorite]
shoppingList: Table<ShoppingListItem> // ++id, userId
```

Compound index `[userId+isFavorite]` enables efficient favorite queries.

### State Management

- **React local state** (App.tsx): UI state, filters, active tab
- **Dexie live queries** (`useLiveQuery`): Reactive database subscriptions
- **localStorage**: `currentUserId` (session), `user_gemini_api_key` (API key)

## Key Files

| File | Purpose |
|------|---------|
| [App.tsx](App.tsx) | Main orchestrator, state management, view routing |
| [types.ts](types.ts) | Domain entities (Recipe, User, ShoppingListItem, Ingredient) |
| [constants.ts](constants.ts) | Dietary options, currency settings |
| [utils.ts](utils.ts) | Helpers: formatQuantity (fractions), convertIngredient (units) |
| [core/interfaces.ts](core/interfaces.ts) | Port interfaces for hexagonal architecture |

## AI Integration

Uses Google Generative AI (`@google/genai` v0.1.0):
- **Gemini 2.5-Flash** for recipe analysis and generation
- **Gemini 2.5-Flash-Image** for recipe image generation
- Structured JSON Schema responses for type-safe parsing

API key resolution order:
1. `localStorage.getItem('user_gemini_api_key')`
2. `process.env.API_KEY` (via Vite: `VITE_API_KEY`)

## Component Architecture

```
App
├── Header (navigation, dark mode)
├── LoginView (user management)
├── FilterSidebar (dietary/difficulty filters)
├── RecipeList → RecipeCard[] (recipes grid)
├── CookingModeView (step-by-step cooking)
├── ShoppingListView (list management)
├── FavoritesView (saved recipes)
├── ProfileView (user settings, API key)
└── Toast (notifications)
```

## TypeScript Configuration

- Strict mode enabled (`strict: true`)
- ES2020 target, ESNext modules
- `noEmit: true` - Vite handles compilation
- React JSX transform (`react-jsx`)
