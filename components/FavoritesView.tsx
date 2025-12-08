import React from 'react';
import type { Recipe } from '../types';
import RecipeCard from './RecipeCard';

interface FavoritesViewProps {
  favorites: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  onToggleFavorite: (recipe: Recipe) => void;
}

const FavoritesView: React.FC<FavoritesViewProps> = ({ favorites, onSelectRecipe, onToggleFavorite }) => {
  return (
    <div className="p-4 sm:p-6 h-full flex flex-col">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">Your Favorite Recipes</h2>
      {favorites.length === 0 ? (
        <div className="flex-grow flex items-center justify-center text-center">
          <div>
            <p className="text-gray-500 dark:text-gray-400">You haven't saved any favorite recipes yet.</p>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Click the heart icon on a recipe to add it here.</p>
          </div>
        </div>
      ) : (
        <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((recipe, index) => (
                <RecipeCard 
                    key={`${recipe.name}-${index}`} 
                    recipe={recipe} 
                    onSelect={() => onSelectRecipe(recipe)}
                    onToggleFavorite={() => onToggleFavorite(recipe)}
                    isFavorite={true}
                />
            ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default FavoritesView;