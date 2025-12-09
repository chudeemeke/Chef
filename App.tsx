
import React, { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useServices } from './contexts/ServiceContext';
import type { Recipe, ShoppingListItem, Ingredient, User } from './types';
import { DIETARY_OPTIONS } from './constants';
import ImageUpload from './components/ImageUpload';
import RecipeList from './components/RecipeList';
import CookingModeView from './components/CookingModeView';
import ShoppingListView from './components/ShoppingListView';
import FavoritesView from './components/FavoritesView';
import FilterSidebar from './components/FilterSidebar';
import Header, { ActiveTab } from './components/Header';
import LoadingAnimation, { LoaderVariant } from './components/Spinner';
import Toast from './components/Toast';
import LoginView from './components/LoginView';
import ProfileView from './components/ProfileView';

const App: React.FC = () => {
  // --- Dependency Injection ---
  const { ai, storage } = useServices();

  // --- User State ---
  const [userId, setUserId] = useState<number | null>(() => {
      const stored = localStorage.getItem('currentUserId');
      return stored ? Number(stored) : null;
  });

  const currentUser = useLiveQuery(() => userId ? storage.users.get(userId) : undefined, [userId]);
  
  // --- Data Queries ---
  // Using the repositories exposed by Storage Engine
  const shoppingList = useLiveQuery(
      userId ? storage.shoppingList.getQuery(userId) : () => Promise.resolve([]), 
      [userId]
  ) || [];

  const favorites = useLiveQuery(
      userId ? storage.recipes.getQuery(userId) : () => Promise.resolve([]),
      [userId]
  ) || [];

  // --- UI State ---
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('recipes');
  
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStrategy, setScanStrategy] = useState<'replace' | 'append'>('replace');

  // Filters
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [activeDifficultyFilters, setActiveDifficultyFilters] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Analyzing your fridge...');
  const [loadingVariant, setLoadingVariant] = useState<LoaderVariant>('chef');
  const [error, setError] = useState<string | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
      message: '',
      type: 'success',
      visible: false
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
      setToast({ message, type, visible: true });
  }, []);

  const hideToast = useCallback(() => {
      setToast(prev => ({ ...prev, visible: false }));
  }, []);

  // --- Effects ---

  useEffect(() => {
    if (currentUser) {
        const root = window.document.documentElement;
        if (currentUser.preferences.darkMode) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        
        if (activeFilters.length === 0 && currentUser.preferences.dietaryFilters.length > 0) {
            setActiveFilters(currentUser.preferences.dietaryFilters);
        }
        if (activeDifficultyFilters.length === 0 && currentUser.preferences.difficultyFilters && currentUser.preferences.difficultyFilters.length > 0) {
            setActiveDifficultyFilters(currentUser.preferences.difficultyFilters);
        }
    }
  }, [currentUser]); 

  useEffect(() => {
    let filtered = recipes;
    if (activeFilters.length > 0) {
      filtered = filtered.filter(recipe =>
        activeFilters.every(filter => recipe.dietaryTags.includes(filter))
      );
    }
    if (activeDifficultyFilters.length > 0) {
      filtered = filtered.filter(recipe =>
        activeDifficultyFilters.includes(recipe.difficulty)
      );
    }
    setFilteredRecipes(filtered);
  }, [recipes, activeFilters, activeDifficultyFilters]);

  // --- Handlers ---

  const handleLogin = (user: User) => {
      if (user.id) {
          setUserId(user.id);
          localStorage.setItem('currentUserId', String(user.id));
      }
  };

  const handleLogout = () => {
      setUserId(null);
      localStorage.removeItem('currentUserId');
      setRecipes([]);
      setActiveTab('recipes');
  };

  const handleUpdateUser = async (updates: Partial<User>) => {
      if (userId) await storage.users.update(userId, updates);
  };

  const processRecipes = async (fetchedRecipes: Recipe[]) => {
      const recipesWithImages = await Promise.all(
        fetchedRecipes.map(async (recipe) => {
          const imageUrls = await ai.generateRecipeImage(recipe.name, recipe.description);
          return { ...recipe, imageUrls, userId: userId || undefined };
        })
      );
      
      if (scanStrategy === 'append') {
          setRecipes(prev => [...prev, ...recipesWithImages]);
          showToast(`Added ${recipesWithImages.length} new recipes`);
      } else {
          setRecipes(recipesWithImages);
      }
  };

  const handleImageAnalysis = useCallback(async (base64Image: string) => {
    setIsLoading(true);
    setLoadingVariant('chef');
    setIsScanning(false);
    setLoadingMessage("Analyzing your fridge...");
    setError(null);
    setSelectedRecipe(null);
    
    if (scanStrategy === 'replace') setRecipes([]);

    try {
      const generatedRecipes = await ai.analyzeImage(base64Image);
      await processRecipes(generatedRecipes);
    } catch (err: any) {
      const msg = err.message || 'Failed to get recipes.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast, userId, scanStrategy, ai]);

  const handleGenerateRecipeFromShoppingList = useCallback(async (ingredients: string[]) => {
      setIsLoading(true);
      setLoadingVariant('chef');
      setLoadingMessage("Cooking up ideas...");
      setError(null);
      setSelectedRecipe(null);
      setScanStrategy('replace');
      
      setActiveTab('recipes');
      
      try {
          const generatedRecipes = await ai.generateRecipesFromIngredients(ingredients);
          await processRecipes(generatedRecipes);
      } catch (err: any) {
          const msg = err.message || 'Failed to create recipes.';
          setError(msg);
          showToast(msg, 'error');
      } finally {
          setIsLoading(false);
      }
  }, [showToast, userId, ai]);

  const handleFilterChange = (filter: string, isChecked: boolean) => {
    setActiveFilters(prev => isChecked ? [...prev, filter] : prev.filter(f => f !== filter));
  };

  const handleDifficultyFilterChange = (filter: string, isChecked: boolean) => {
    setActiveDifficultyFilters(prev => isChecked ? [...prev, filter] : prev.filter(f => f !== filter));
  };
  
  // Storage Handlers
  const handleAddToShoppingList = useCallback(async (itemText: string, category: string, ingredient?: Ingredient, quantity?: number, unit?: string) => {
    if (!userId) return;
    await storage.shoppingList.add({
        userId,
        text: itemText,
        category: category || 'Other',
        checked: false,
        ingredient,
        quantity,
        unit
    });
    showToast(`Added ${itemText} to list`, 'success');
  }, [showToast, userId, storage]);

  const handleUpdateShoppingItem = async (id: string, updates: Partial<ShoppingListItem>) => {
      await storage.shoppingList.update(Number(id), updates);
  };

  const handleToggleShoppingItem = async (itemId: string) => {
      await storage.shoppingList.toggleCheck(Number(itemId));
  };
  
  const handleReorderShoppingList = (_items: ShoppingListItem[]) => { /* Persist if needed */ };

  const handleClearShoppingList = async () => {
      if (userId && window.confirm("Delete all shopping items?")) {
          await storage.shoppingList.deleteAll(userId);
      }
  }

  const handleUncheckAllShoppingList = async () => {
      if (userId && window.confirm("Restart list?")) {
          await storage.shoppingList.uncheckAll(userId);
      }
  }

  const handleToggleFavorite = useCallback(async (recipe: Recipe) => {
    if (!userId) return;
    const isAdded = await storage.recipes.toggleFavorite(userId, recipe);
    showToast(isAdded ? 'Added to favorites' : 'Removed from favorites');
  }, [showToast, userId, storage]);

  const handleReset = () => {
    setRecipes([]);
    setSelectedRecipe(null);
    setError(null);
    setIsLoading(false);
    setIsScanning(false);
    setScanStrategy('replace');
    setActiveTab('recipes');
  };

  const handleStartAppendScan = () => {
      setScanStrategy('append');
      setIsScanning(true);
  };

  const handleStartReplaceScan = () => {
      setScanStrategy('replace');
      setIsScanning(true);
  };

  // --- Render ---

  if (userId && currentUser === undefined) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
            <LoadingAnimation variant="shopping" />
        </div>
      );
  }

  if (!userId || !currentUser) {
      return <LoginView onLogin={handleLogin} />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
        case 'shoppingList':
            const uiShoppingList = shoppingList.map(i => ({...i, id: String(i.id)}));
            return <ShoppingListView 
                      items={uiShoppingList}
                      onAddItem={(text, category, quantity, unit) => handleAddToShoppingList(text, category, undefined, quantity, unit)}
                      onUpdateItem={handleUpdateShoppingItem}
                      onToggleItem={handleToggleShoppingItem}
                      onClear={handleClearShoppingList}
                      onUncheckAll={handleUncheckAllShoppingList}
                      onGenerateRecipe={handleGenerateRecipeFromShoppingList}
                      onReorderItems={handleReorderShoppingList}
                      currency={currentUser.preferences.currency || '$'}
                   />;
        case 'favorites':
            return <FavoritesView 
                        favorites={favorites} 
                        onSelectRecipe={setSelectedRecipe}
                        onToggleFavorite={handleToggleFavorite}
                    />;
        case 'profile':
            return <ProfileView 
                        user={currentUser}
                        stats={{ favoritesCount: favorites.length, shoppingListCount: shoppingList.length }}
                        onNavigate={setActiveTab}
                        onUpdateUser={handleUpdateUser}
                        onLogout={handleLogout}
                        showToast={showToast}
                   />;
        case 'recipes':
        default:
            return currentRecipeView;
    }
  }

  const currentRecipeView = (
    <>
    {selectedRecipe ? (
        <CookingModeView
          recipe={selectedRecipe}
          onExit={() => setSelectedRecipe(null)}
          onAddToShoppingList={(text, cat, ing) => handleAddToShoppingList(text, cat, ing)}
          onShowToast={showToast}
        />
    ) : isLoading ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 dark:text-gray-200">
          <LoadingAnimation variant={loadingVariant} />
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mt-4">{loadingMessage}</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Our AI chef is working their magic...</p>
        </div>
    ) : error ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <p className="text-red-500 text-lg dark:text-red-400 font-medium mb-4">{error}</p>
            <button onClick={handleReset} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md">Try Again</button>
        </div>
    ) : (recipes.length > 0 && !isScanning) ? (
       <RecipeList 
                recipes={filteredRecipes} 
                onSelectRecipe={setSelectedRecipe} 
                onReset={handleStartReplaceScan}
                onAppend={handleStartAppendScan}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
       />
    ) : (
       <ImageUpload onImageUpload={handleImageAnalysis} />
    )}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Header 
        user={currentUser}
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onReset={handleReset} 
        toggleDarkMode={() => handleUpdateUser({ preferences: { ...currentUser.preferences, darkMode: !currentUser.preferences.darkMode }})}
        onLogout={handleLogout}
      />
      <div className="flex-grow flex flex-col md:flex-row container mx-auto p-4 md:p-6 gap-6">
        {activeTab === 'recipes' && recipes.length > 0 && !selectedRecipe && !isScanning && (
          <FilterSidebar
            dietaryOptions={DIETARY_OPTIONS}
            activeDietaryFilters={activeFilters}
            onDietaryChange={handleFilterChange}
            difficultyOptions={['Easy', 'Medium', 'Hard']}
            activeDifficultyFilters={activeDifficultyFilters}
            onDifficultyChange={handleDifficultyFilterChange}
          />
        )}
        <main className="flex-grow bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 dark:border dark:border-gray-700 overflow-hidden flex flex-col transition-colors duration-200">
            {renderActiveView()}
        </main>
      </div>
      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={hideToast} />
    </div>
  );
};

export default App;
