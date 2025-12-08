
import React, { useState, useRef, useEffect } from 'react';
import { db } from '../db';
import type { User, Recipe, ShoppingListItem } from '../types';
import { DIETARY_OPTIONS, CURRENCY_OPTIONS } from '../constants';
import { TrashIcon, CheckIcon, MoonIcon, SunIcon, HeartIcon, DownloadIcon, UploadIcon, ZapIcon } from './icons';
import { ActiveTab } from './Header';

interface ProfileViewProps {
  user: User;
  stats: {
    favoritesCount: number;
    shoppingListCount: number;
  };
  onNavigate: (tab: ActiveTab) => void;
  onUpdateUser: (updates: Partial<User>) => void;
  onLogout: () => void;
  showToast: (msg: string) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, stats, onNavigate, onUpdateUser, onLogout, showToast }) => {
  const [name, setName] = useState(user.name);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // API Key State
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [hasStoredKey, setHasStoredKey] = useState(false);

  useEffect(() => {
      const stored = localStorage.getItem('user_gemini_api_key');
      if (stored) setHasStoredKey(true);
  }, []);

  const handleSaveName = () => {
      if (name.trim()) {
          onUpdateUser({ name: name.trim() });
          setIsEditing(false);
          showToast('Name updated');
      }
  };

  const handleSaveApiKey = () => {
      if (apiKey.trim()) {
          localStorage.setItem('user_gemini_api_key', apiKey.trim());
          setHasStoredKey(true);
          setApiKey('');
          setShowKeyInput(false);
          showToast('API Key saved securely');
      }
  };

  const handleRemoveApiKey = () => {
      localStorage.removeItem('user_gemini_api_key');
      setHasStoredKey(false);
      showToast('API Key removed');
  };

  const toggleDietaryFilter = (filter: string) => {
      const current = user.preferences.dietaryFilters || [];
      const updated = current.includes(filter)
          ? current.filter(f => f !== filter)
          : [...current, filter];
      
      onUpdateUser({ 
          preferences: { 
              ...user.preferences, 
              dietaryFilters: updated 
          } 
      });
  };

  const toggleDifficultyFilter = (filter: string) => {
      const current = user.preferences.difficultyFilters || [];
      const updated = current.includes(filter)
          ? current.filter(f => f !== filter)
          : [...current, filter];
      
      onUpdateUser({ 
          preferences: { 
              ...user.preferences, 
              difficultyFilters: updated 
          } 
      });
  };

  const handleCurrencyChange = (symbol: string) => {
      onUpdateUser({ 
          preferences: { 
              ...user.preferences, 
              currency: symbol 
          } 
      });
  };

  const toggleDarkMode = () => {
       onUpdateUser({ 
          preferences: { 
              ...user.preferences, 
              darkMode: !user.preferences.darkMode 
          } 
      });
  };

  const handleClearData = async () => {
      if (window.confirm("Are you sure you want to delete ALL your recipes and shopping lists? This cannot be undone.")) {
          if (user.id) {
              await db.shoppingList.where('userId').equals(user.id).delete();
              await db.recipes.where('userId').equals(user.id).delete();
              showToast('All your data has been cleared.');
          }
      }
  };

  const handleDeleteProfile = async () => {
      if (window.confirm("Delete this profile completely?")) {
           if (user.id) {
               await db.users.delete(user.id);
               await db.shoppingList.where('userId').equals(user.id).delete();
               await db.recipes.where('userId').equals(user.id).delete();
               onLogout();
           }
      }
  };

  const handleExportData = async () => {
      try {
          if (!user.id) return;
          
          const recipes = await db.recipes.where('userId').equals(user.id).toArray();
          const shoppingList = await db.shoppingList.where('userId').equals(user.id).toArray();
          
          const data = {
              version: 1,
              timestamp: Date.now(),
              user: { name: user.name, preferences: user.preferences },
              recipes,
              shoppingList
          };
          
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          
          const safeName = user.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
          const date = new Date().toISOString().split('T')[0];
          
          const a = document.createElement('a');
          a.href = url;
          a.download = `chef-backup-${safeName}-${date}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          showToast("Data exported successfully");
      } catch (e) {
          console.error("Export failed", e);
          showToast("Failed to export data");
      }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
              if (!user.id) return;
              
              const json = JSON.parse(event.target?.result as string);
              if (!json.version || !json.recipes || !json.shoppingList) {
                  throw new Error("Invalid backup file format");
              }
              
              if (window.confirm(`Importing data will merge ${json.recipes.length} recipes and ${json.shoppingList.length} items into your current profile. Continue?`)) {
                  
                  // Process Recipes: Remove old IDs and assign current userId
                  const newRecipes = (json.recipes as Recipe[]).map(r => {
                      const { id, ...rest } = r; 
                      return { ...rest, userId: user.id };
                  });
                  
                  // Process Shopping List: Remove old IDs and assign current userId
                  const newList = (json.shoppingList as ShoppingListItem[]).map(i => {
                      const { id, ...rest } = i; 
                      return { ...rest, userId: user.id };
                  });
                  
                  // Use array syntax for transaction tables to avoid type issues with Dexie 3+
                  // Cast db to any because TypeScript sometimes struggles with inherited transaction method on subclasses
                  await (db as any).transaction('rw', [db.recipes, db.shoppingList], async () => {
                      if (newRecipes.length > 0) await db.recipes.bulkAdd(newRecipes);
                      if (newList.length > 0) await db.shoppingList.bulkAdd(newList);
                  });
                  
                  showToast("Data imported successfully!");
                  
                  // Clear input so the same file can be selected again if needed
                  if (fileInputRef.current) fileInputRef.current.value = '';
              }
          } catch (err) {
              console.error("Import failed", err);
              showToast("Failed to import: Invalid file");
          }
      };
      reader.readAsText(file);
  };

  const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'];

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 animate-fadeIn">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center">
            <div className="text-6xl mb-4 bg-gray-100 dark:bg-gray-700 rounded-full p-4 w-24 h-24 flex items-center justify-center border-4 border-white dark:border-gray-600 shadow-md">
                {user.avatar}
            </div>
            
            {isEditing ? (
                <div className="flex gap-2 items-center mb-2 justify-center">
                    <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        className="text-2xl font-bold text-center bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none w-auto min-w-[150px]"
                        autoFocus
                    />
                    <button onClick={handleSaveName} className="p-2 text-green-600 hover:bg-green-100 rounded-full"><CheckIcon className="w-6 h-6"/></button>
                </div>
            ) : (
                <h2 
                    className="text-3xl font-bold text-gray-900 dark:text-white mb-1 cursor-pointer hover:opacity-70 flex items-center justify-center gap-2 group"
                    onClick={() => setIsEditing(true)}
                    title="Click to edit name"
                >
                    {user.name}
                    <span className="text-sm font-normal text-gray-400 group-hover:text-blue-500 transition-colors">✎</span>
                </h2>
            )}
            <p className="text-gray-500 dark:text-gray-400">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>

        {/* Kitchen Stats - Usage Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
                onClick={() => onNavigate('favorites')}
                className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
            >
                <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Saved Recipes</span>
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg group-hover:scale-110 transition-transform">
                        <HeartIcon className="w-6 h-6" isFilled />
                    </div>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">{stats.favoritesCount}</span>
                    <span className="text-sm text-gray-400">Favorites</span>
                </div>
            </div>

            <div 
                onClick={() => onNavigate('shoppingList')}
                className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
            >
                <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Shopping List</span>
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-lg group-hover:scale-110 transition-transform">
                        <span className="text-xl">🛒</span>
                    </div>
                </div>
                <div className="flex items-baseline gap-2">
                     <span className="text-4xl font-bold text-gray-900 dark:text-white">{stats.shoppingListCount}</span>
                    <span className="text-sm text-gray-400">Items</span>
                </div>
            </div>
        </div>

        {/* Settings Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Preferences</h3>
            </div>
            
            <div className="p-6 space-y-8">
                {/* Dark Mode */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${user.preferences.darkMode ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-yellow-100 text-yellow-600'}`}>
                            {user.preferences.darkMode ? <MoonIcon className="w-5 h-5"/> : <SunIcon className="w-5 h-5"/>}
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Appearance</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.preferences.darkMode ? 'Dark Mode' : 'Light Mode'}</p>
                        </div>
                    </div>
                    <button 
                        onClick={toggleDarkMode}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${user.preferences.darkMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${user.preferences.darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                {/* Currency Selection */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300 min-w-[2.5rem] flex justify-center">
                            <span className="text-lg font-bold flex items-center justify-center">{user.preferences.currency || '$'}</span>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Currency</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Preferred symbol for pricing</p>
                        </div>
                    </div>
                    <select
                        value={user.preferences.currency || '$'}
                        onChange={(e) => handleCurrencyChange(e.target.value)}
                        className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                    >
                        {CURRENCY_OPTIONS.map(opt => (
                            <option key={opt.symbol} value={opt.symbol}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-700 pt-6"></div>

                {/* Dietary Filters */}
                <div>
                    <p className="font-medium text-gray-900 dark:text-white mb-3">Default Dietary Preferences</p>
                    <div className="flex flex-wrap gap-2">
                        {DIETARY_OPTIONS.map(option => {
                            const isActive = user.preferences.dietaryFilters.includes(option);
                            return (
                                <button
                                    key={option}
                                    onClick={() => toggleDietaryFilter(option)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                        isActive 
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 ring-2 ring-green-500 dark:ring-green-400' 
                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {option}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Difficulty Filters */}
                <div>
                    <p className="font-medium text-gray-900 dark:text-white mb-3">Default Difficulty Level</p>
                    <div className="flex flex-wrap gap-2">
                        {DIFFICULTY_OPTIONS.map(option => {
                            const isActive = user.preferences.difficultyFilters?.includes(option);
                            return (
                                <button
                                    key={option}
                                    onClick={() => toggleDifficultyFilter(option)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                        isActive 
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 ring-2 ring-blue-500 dark:ring-blue-400' 
                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {option}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>

        {/* API Key Configuration */}
        <div className="bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-200 dark:border-purple-900/30 overflow-hidden">
            <div className="p-6">
                 <div className="flex items-start gap-4 mb-4">
                     <div className="p-2 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 rounded-lg">
                        <ZapIcon className="w-6 h-6" />
                     </div>
                     <div>
                        <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300">API Configuration</h3>
                        <p className="text-sm text-purple-700 dark:text-purple-400 mt-1">
                            Use your own Gemini API Key. Keys are stored locally on your device.
                        </p>
                     </div>
                 </div>
                 
                 {hasStoredKey ? (
                     <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-purple-100 dark:border-purple-900/30">
                         <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                             <CheckIcon className="w-5 h-5" />
                             <span className="font-medium">Custom API Key Active</span>
                         </div>
                         <button 
                            onClick={handleRemoveApiKey}
                            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 hover:underline"
                         >
                             Remove Key
                         </button>
                     </div>
                 ) : (
                     <div className="space-y-3">
                         {!showKeyInput ? (
                             <button 
                                onClick={() => setShowKeyInput(true)}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-sm text-sm font-medium"
                             >
                                 Enter API Key
                             </button>
                         ) : (
                             <div className="flex gap-2 animate-fadeIn">
                                 <input 
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Paste Gemini API Key..."
                                    className="flex-grow px-3 py-2 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                 />
                                 <button 
                                    onClick={handleSaveApiKey}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-sm text-sm font-medium"
                                 >
                                     Save
                                 </button>
                                 <button 
                                    onClick={() => setShowKeyInput(false)}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
                                 >
                                     Cancel
                                 </button>
                             </div>
                         )}
                         <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                             Get a key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline hover:text-purple-500">Google AI Studio</a>.
                         </p>
                     </div>
                 )}
            </div>
        </div>

        {/* Data Management Section (The Middle Ground) */}
        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-200 dark:border-blue-900/30 overflow-hidden">
            <div className="p-6">
                 <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">Data Management</h3>
                 <p className="text-sm text-blue-700 dark:text-blue-400 mb-4">
                     Backup your recipes and shopping list to a file, or restore from a previous backup. This allows you to transfer data between devices without an account.
                 </p>
                 <div className="flex flex-col sm:flex-row gap-3">
                     <button 
                        onClick={handleExportData}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors shadow-sm"
                     >
                         <DownloadIcon className="w-5 h-5" />
                         Export Data
                     </button>
                     <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm cursor-pointer hover:shadow-md">
                         <UploadIcon className="w-5 h-5" />
                         <span>Import Backup</span>
                         <input 
                            type="file" 
                            accept=".json"
                            ref={fileInputRef}
                            onChange={handleImportData}
                            className="hidden"
                         />
                     </label>
                 </div>
            </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-900/30 overflow-hidden">
            <div className="p-6">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-4">Danger Zone</h3>
                <div className="space-y-3">
                     <button 
                        onClick={handleClearData}
                        className="w-full text-left px-4 py-3 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800/30 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-between group"
                    >
                        <span>Clear Saved Data (Recipes & Shopping List)</span>
                        <TrashIcon className="w-5 h-5 opacity-60 group-hover:opacity-100" />
                    </button>
                    <button 
                        onClick={onLogout}
                        className="w-full text-left px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Log Out
                    </button>
                    <button 
                        onClick={handleDeleteProfile}
                        className="w-full text-left px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium hover:shadow-md"
                    >
                        Delete Profile Permanently
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ProfileView;
