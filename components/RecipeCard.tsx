
import React, { useState } from 'react';
import type { Recipe } from '../types';
import { ClockIcon, FlameIcon, ZapIcon, HeartIcon, ShareIcon } from './icons';
import { useShare } from '../hooks/useShare';
import { formatQuantity } from '../utils';

interface RecipeCardProps {
  recipe: Recipe;
  onSelect: () => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
}

const difficultyColorMap = {
  Easy: 'text-green-700 bg-green-100 dark:bg-green-900/40 dark:text-green-300',
  Medium: 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/40 dark:text-yellow-300',
  Hard: 'text-red-700 bg-red-100 dark:bg-red-900/40 dark:text-red-300',
};

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onSelect, onToggleFavorite, isFavorite }) => {
  const difficultyClasses = difficultyColorMap[recipe.difficulty] || 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
  
  // Use a food-specific placeholder service. "lock" ensures consistent image for same recipe name length/char sum.
  const seed = recipe.name.length + (recipe.calories || 0);
  const fallbackImage = `https://loremflickr.com/800/450/food,dish?lock=${seed}`;
  
  const [imgSrc, setImgSrc] = useState(recipe.imageUrls?.[0] || fallbackImage);

  // Sharing
  const { share } = useShare((msg) => alert(msg)); 

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite();
  };
  
  const handleShareClick = async (e: React.MouseEvent) => {
      e.stopPropagation();
      const ingredientText = recipe.ingredients.map(i => `- ${formatQuantity(i.quantity)} ${i.unit} ${i.name}`).join('\n');
      const shareText = `Check out this recipe: ${recipe.name}\n\n${recipe.description}\n\nIngredients:\n${ingredientText}`;
      
      await share({
          title: recipe.name,
          text: shareText,
      });
  };
  
  const handleError = () => {
      if (imgSrc !== fallbackImage) {
          setImgSrc(fallbackImage);
      }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden group h-full">
      <div className="relative aspect-video bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <img 
          src={imgSrc} 
          alt={recipe.name} 
          onError={handleError}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out" 
        />
        {/* Favorite Overlay: More prominent on hover or if selected */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/50 to-transparent transition-opacity duration-300 ${isFavorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>
        
        <div className="absolute top-2 right-2 flex gap-2">
            <button
                onClick={handleShareClick}
                className="p-2 rounded-full backdrop-blur-sm bg-white/90 text-gray-500 hover:text-blue-600 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300"
                aria-label="Share recipe"
            >
                <ShareIcon className="w-5 h-5" />
            </button>
            
            <button
            onClick={handleFavoriteClick}
            className={`p-2 rounded-full backdrop-blur-sm transition-all duration-300 ${
                isFavorite 
                    ? 'bg-red-500 text-white shadow-md' 
                    : 'bg-white/90 text-gray-500 hover:text-red-500 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0'
            }`}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
                <HeartIcon className="w-5 h-5" isFilled={isFavorite} />
            </button>
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate" title={recipe.name}>{recipe.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex-grow line-clamp-2">{recipe.description}</p>
        
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-medium ${difficultyClasses}`}>
            <FlameIcon className="w-4 h-4 mr-1.5" />
            {recipe.difficulty}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full font-medium text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/40">
            <ClockIcon className="w-4 h-4 mr-1.5" />
            {recipe.prepTime} min
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full font-medium text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/40">
            <ZapIcon className="w-4 h-4 mr-1.5" />
            {recipe.calories} kcal
          </span>
        </div>
      </div>
      <div className="p-4 pt-0">
        <button
          onClick={onSelect}
          className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cook Now
        </button>
      </div>
    </div>
  );
};

export default RecipeCard;
