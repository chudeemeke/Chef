
import React from 'react';
import type { User } from '../types';
import { SunIcon, MoonIcon } from './icons';

export type ActiveTab = 'recipes' | 'shoppingList' | 'favorites' | 'profile';

interface HeaderProps {
  user: User | null;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onReset: () => void;
  toggleDarkMode: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, activeTab, setActiveTab, onReset, toggleDarkMode, onLogout }) => {
  const getTabClass = (tabName: ActiveTab) => {
    return activeTab === tabName
      ? 'border-blue-600 text-blue-700 dark:text-blue-400 dark:border-blue-400'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600';
  };

  return (
    <header className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-sm sticky top-0 z-10 transition-colors duration-200 border-b dark:border-gray-700">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-4">
             <button
              onClick={onReset}
              className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-sm"
              aria-label="Go to homepage"
            >
              Chef 🍳
            </button>
          </div>
         
          <div className="flex items-center gap-4">
            {user ? (
                <>
                    <nav className="hidden md:flex space-x-2">
                        <button
                        onClick={() => setActiveTab('recipes')}
                        className={`py-2 px-3 text-sm font-medium border-b-2 transition-colors duration-200 ${getTabClass('recipes')}`}
                        >
                        Recipes
                        </button>
                        <button
                        onClick={() => setActiveTab('favorites')}
                        className={`py-2 px-3 text-sm font-medium border-b-2 transition-colors duration-200 ${getTabClass('favorites')}`}
                        >
                        Favorites
                        </button>
                        <button
                        onClick={() => setActiveTab('shoppingList')}
                        className={`py-2 px-3 text-sm font-medium border-b-2 transition-colors duration-200 ${getTabClass('shoppingList')}`}
                        >
                        Shopping List
                        </button>
                    </nav>
                    <div className="border-l border-gray-300 dark:border-gray-600 h-6 mx-2 hidden md:block"></div>
                    
                    <button
                        onClick={toggleDarkMode}
                        className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        aria-label="Toggle Dark Mode"
                    >
                        {user.preferences.darkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                    </button>

                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex items-center gap-2 pl-2 pr-3 py-1 rounded-full border transition-all ${activeTab === 'profile' ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        <span className="text-xl" role="img" aria-label="avatar">{user.avatar}</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:inline">{user.name}</span>
                    </button>
                </>
            ) : null}
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {user && (
            <div className="md:hidden flex justify-between pb-2 overflow-x-auto">
                 <button
                    onClick={() => setActiveTab('recipes')}
                    className={`py-2 px-3 text-sm font-medium whitespace-nowrap ${activeTab === 'recipes' ? 'text-blue-600 font-bold' : 'text-gray-500 dark:text-gray-400'}`}
                >
                Recipes
                </button>
                <button
                    onClick={() => setActiveTab('favorites')}
                    className={`py-2 px-3 text-sm font-medium whitespace-nowrap ${activeTab === 'favorites' ? 'text-blue-600 font-bold' : 'text-gray-500 dark:text-gray-400'}`}
                >
                Favorites
                </button>
                <button
                    onClick={() => setActiveTab('shoppingList')}
                    className={`py-2 px-3 text-sm font-medium whitespace-nowrap ${activeTab === 'shoppingList' ? 'text-blue-600 font-bold' : 'text-gray-500 dark:text-gray-400'}`}
                >
                Shop
                </button>
            </div>
        )}
      </div>
    </header>
  );
};

export default Header;
