
import React, { useState } from 'react';
import type { Recipe } from '../types';
import RecipeCard from './RecipeCard';
import { PlusIcon, XIcon, RefreshIcon, UploadIcon } from './icons';

interface RecipeListProps {
  recipes: Recipe[];
  favorites: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  onToggleFavorite: (recipe: Recipe) => void;
  onReset: () => void;
  onAppend: () => void;
}

const RecipeList: React.FC<RecipeListProps> = ({ recipes, favorites, onSelectRecipe, onToggleFavorite, onReset, onAppend }) => {
  const [showAddOptions, setShowAddOptions] = useState(false);

  if (recipes.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">No Recipes Found</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Try adjusting your filters or uploading a new photo.</p>
            <button onClick={onReset} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Start Over</button>
        </div>
    )
  }
  
  const isFavorite = (recipe: Recipe) => favorites.some(fav => fav.name === recipe.name);

  const handlePlusClick = () => {
    setShowAddOptions(true);
  };

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col relative">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Your Recipe Suggestions</h2>
        </div>
      
        <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe, index) => (
                <RecipeCard 
                    key={`${recipe.name}-${index}`} 
                    recipe={recipe} 
                    onSelect={() => onSelectRecipe(recipe)}
                    onToggleFavorite={() => onToggleFavorite(recipe)}
                    isFavorite={isFavorite(recipe)}
                />
            ))}
            </div>
        </div>

        <button
          onClick={handlePlusClick}
          className="absolute bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 z-10"
          aria-label="Upload a new photo"
        >
          <PlusIcon className="w-8 h-8" />
        </button>

        {/* Add Options Modal */}
        {showAddOptions && (
            <div className="absolute inset-0 z-20 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 rounded-2xl">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6 transform transition-all scale-100 border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add New Recipes</h3>
                        <button 
                            onClick={() => setShowAddOptions(false)} 
                            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition"
                        >
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        How would you like to add new recipes to your current view?
                    </p>
                    <div className="space-y-3">
                        <button 
                            onClick={() => { setShowAddOptions(false); onAppend(); }}
                            className="w-full flex items-center p-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-left"
                        >
                            <div className="p-2 bg-blue-200 dark:bg-blue-800 rounded-full mr-3 text-blue-700 dark:text-blue-100">
                                <PlusIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="block font-bold">Add to List</span>
                                <span className="text-sm opacity-80">Keep current recipes and append new ones.</span>
                            </div>
                        </button>

                        <button 
                            onClick={() => { setShowAddOptions(false); onReset(); }}
                            className="w-full flex items-center p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors text-left"
                        >
                            <div className="p-2 bg-gray-200 dark:bg-gray-600 rounded-full mr-3 text-gray-700 dark:text-gray-300">
                                <RefreshIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="block font-bold">Start Fresh</span>
                                <span className="text-sm opacity-80">Clear current recipes and replace them.</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default RecipeList;
