import React from 'react';

interface FilterSidebarProps {
  dietaryOptions: string[];
  activeDietaryFilters: string[];
  onDietaryChange: (filter: string, isChecked: boolean) => void;
  difficultyOptions: string[];
  activeDifficultyFilters: string[];
  onDifficultyChange: (filter: string, isChecked: boolean) => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ 
  dietaryOptions, 
  activeDietaryFilters, 
  onDietaryChange,
  difficultyOptions,
  activeDifficultyFilters,
  onDifficultyChange
}) => {
  return (
    <aside className="w-full md:w-64 lg:w-72 flex-shrink-0 bg-white dark:bg-gray-800 dark:border dark:border-gray-700 p-6 rounded-2xl shadow-lg self-start transition-colors duration-200 space-y-8">
      
      {/* Dietary Filters */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b dark:border-gray-700 pb-3 mb-4">Dietary Filters</h3>
        <div className="space-y-3">
          {dietaryOptions.map(option => (
            <label key={option} className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-colors"
                checked={activeDietaryFilters.includes(option)}
                onChange={(e) => onDietaryChange(option, e.target.checked)}
              />
              <span className="text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Difficulty Filters */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b dark:border-gray-700 pb-3 mb-4">Difficulty</h3>
        <div className="space-y-3">
          {difficultyOptions.map(option => (
            <label key={option} className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-colors"
                checked={activeDifficultyFilters.includes(option)}
                onChange={(e) => onDifficultyChange(option, e.target.checked)}
              />
              <span className="text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{option}</span>
            </label>
          ))}
        </div>
      </div>
      
    </aside>
  );
};

export default FilterSidebar;