
import React, { useState, useMemo } from 'react';
import type { ShoppingListItem } from '../types';
import { PlusCircleIcon, TrashIcon, PencilIcon, CheckIcon, WandIcon, RefreshIcon, DragHandleIcon, PlusIcon, SearchIcon, ShareIcon } from './icons';
import { INGREDIENT_CATEGORIES, convertIngredient, formatQuantity } from '../utils';
import { useShare } from '../hooks/useShare';

interface ShoppingListViewProps {
  items: ShoppingListItem[];
  onAddItem: (text: string, category: string, quantity?: number, unit?: string) => void;
  onUpdateItem: (id: string, updates: Partial<ShoppingListItem>) => void;
  onToggleItem: (itemId: string) => void;
  onClear: () => void;
  onUncheckAll: () => void;
  onGenerateRecipe: (ingredients: string[]) => void;
  onReorderItems: (items: ShoppingListItem[]) => void;
  currency: string;
}

const ShoppingListView: React.FC<ShoppingListViewProps> = ({ 
  items, 
  onAddItem, 
  onUpdateItem, 
  onToggleItem, 
  onClear, 
  onUncheckAll,
  onGenerateRecipe,
  onReorderItems,
  currency
}) => {
  const [newItemText, setNewItemText] = useState('');
  const [newItemCategory, setNewItemCategory] = useState(INGREDIENT_CATEGORIES[0]);
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');
  
  const [unitSystem, setUnitSystem] = useState<'imperial' | 'metric'>('imperial');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnit, setEditUnit] = useState('');

  // Drag and Drop State
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

  // Sharing
  const { share } = useShare((msg) => alert(msg)); // Simple alert fallback for now, real toast needs refactor

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemText.trim()) {
      const qty = newItemQuantity ? parseFloat(newItemQuantity) : undefined;
      onAddItem(newItemText.trim(), newItemCategory, qty, newItemUnit.trim());
      setNewItemText('');
      setNewItemQuantity('');
      setNewItemUnit('');
      // Do not reset category as requested
    }
  };

  const startEditing = (item: ShoppingListItem) => {
    setEditingId(String(item.id));
    setEditText(item.text);
    setEditCategory(item.category);
    // Determine initial edit values for qty/unit
    if (item.ingredient) {
         // If linked to ingredient, prefer that
         const conv = convertIngredient(item.ingredient, unitSystem);
         setEditQuantity(String(conv.quantity || ''));
         setEditUnit(conv.unit || '');
    } else {
         setEditQuantity(item.quantity ? String(item.quantity) : '');
         setEditUnit(item.unit || '');
    }
  };

  const saveEdit = () => {
    if (editingId && editText.trim()) {
      const qty = editQuantity ? parseFloat(editQuantity) : undefined;
      onUpdateItem(editingId, { 
          text: editText.trim(), 
          category: editCategory,
          quantity: qty,
          unit: editUnit.trim()
      });
      setEditingId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };
  
  const handlePriceChange = (id: string, value: string) => {
      const numValue = parseFloat(value);
      onUpdateItem(id, { price: isNaN(numValue) ? undefined : numValue });
  };

  const handleGenerateClick = () => {
    const ingredients = items.map(i => i.text); // Use text name for recipe generation
    if (ingredients.length > 0) {
      onGenerateRecipe(ingredients);
    }
  };

  const handleShareList = async () => {
      if (items.length === 0) return;
      
      const lines = displayCategories.map(cat => {
          const catItems = groupedItems[cat];
          if (catItems.length === 0) return null;
          const itemLines = catItems.map(item => {
              const checkMark = item.checked ? '[x]' : '[ ]';
              const qty = getItemQuantityDisplay(item);
              const name = getItemName(item);
              return `${checkMark} ${name} ${qty ? `(${qty})` : ''}`;
          }).join('\n');
          return `${cat.toUpperCase()}:\n${itemLines}`;
      }).filter(Boolean).join('\n\n');

      const totalPriceStr = showPricing ? `\n\nTotal Est: ${currency}${totalPrice.toFixed(2)}` : '';

      await share({
          title: 'My Shopping List',
          text: `Shopping List:\n\n${lines}${totalPriceStr}`,
      });
  };

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
      setDraggedItemId(id);
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, category?: string, itemId?: string) => {
      e.preventDefault(); 
      e.dataTransfer.dropEffect = 'move';
      
      if (category && category !== dragOverCategory) setDragOverCategory(category);
      if (itemId !== dragOverItemId) setDragOverItemId(itemId || null);
  };
  
  const handleDragLeave = () => {
      setDragOverItemId(null);
  };

  const handleDrop = (e: React.DragEvent, targetCategory: string, targetId?: string) => {
      e.preventDefault();
      setDragOverCategory(null);
      setDragOverItemId(null);

      if (!draggedItemId) return;
      if (draggedItemId === targetId) {
          setDraggedItemId(null);
          return;
      }

      const draggedItem = items.find(i => String(i.id) === draggedItemId);
      if (!draggedItem) return;

      let newItems = [...items];
      const draggedIndex = newItems.findIndex(i => String(i.id) === draggedItemId);
      
      // Remove from old position
      newItems.splice(draggedIndex, 1);
      
      // Update item category to match drop target
      const updatedItem = { ...draggedItem, category: targetCategory };

      if (targetId) {
          // Dropped onto specific item
          const targetIndex = newItems.findIndex(i => String(i.id) === targetId);
          if (targetIndex !== -1) {
               newItems.splice(targetIndex, 0, updatedItem);
          } else {
               newItems.push(updatedItem);
          }
      } else {
          // Dropped onto category header
          const lastCategoryIndex = newItems.map(i => i.category).lastIndexOf(targetCategory);
          if (lastCategoryIndex !== -1) {
              newItems.splice(lastCategoryIndex + 1, 0, updatedItem);
          } else {
              newItems.push(updatedItem);
          }
      }
      
      // If category changed, trigger update
      if (draggedItem.category !== targetCategory) {
           onUpdateItem(String(draggedItem.id), { category: targetCategory });
      }

      onReorderItems(newItems);
      setDraggedItemId(null);
  };

  const getItemName = (item: ShoppingListItem) => {
      // Just the name, logic for display moved to separate columns
      if (item.ingredient) {
          return item.ingredient.name;
      }
      return item.text;
  }

  const getItemQuantityDisplay = (item: ShoppingListItem) => {
      if (item.ingredient) {
          const converted = convertIngredient(item.ingredient, unitSystem);
          return `${formatQuantity(converted.quantity)} ${converted.unit}`;
      }
      if (item.quantity) {
          return `${formatQuantity(item.quantity)} ${item.unit || ''}`;
      }
      return ''; // No quantity
  };

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    return items.filter(item => 
        item.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, ShoppingListItem[]> = {};
    INGREDIENT_CATEGORIES.forEach(cat => groups[cat] = []);
    groups['Other'] = [];

    filteredItems.forEach(item => {
        const cat = item.category || 'Other';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(item);
    });
    return groups;
  }, [filteredItems]);

  const displayCategories = Object.keys(groupedItems).filter(cat => groupedItems[cat].length > 0 || (cat === newItemCategory && !searchQuery));
  
  const hasItems = items.length > 0;
  
  // Pricing logic
  const totalPrice = items.reduce((sum, item) => sum + (item.price || 0), 0);
  const showPricing = items.some(item => item.price !== undefined && item.price > 0);

  return (
    <div className="p-6 md:p-8 h-full flex flex-col bg-gray-50/50 dark:bg-gray-900">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
           <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Shopping List</h2>
           <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your groceries and budget.</p>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
            {/* Unit Toggle */}
            <div className="flex bg-gray-200 dark:bg-gray-700 p-0.5 rounded-lg mr-2">
                <button 
                    onClick={() => setUnitSystem('imperial')} 
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${unitSystem === 'imperial' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    Imperial
                </button>
                <button 
                    onClick={() => setUnitSystem('metric')} 
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${unitSystem === 'metric' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    Metric
                </button>
            </div>

            <button
                onClick={handleShareList}
                disabled={!hasItems}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition shadow-sm"
                title="Share this list"
            >
                <ShareIcon className="w-4 h-4" />
            </button>

             <button
              onClick={handleGenerateClick}
              disabled={!hasItems}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 transition shadow-sm hover:shadow"
              title="Create a recipe from these items"
            >
              <WandIcon className="w-4 h-4" />
              Cook This List
            </button>
            <button
              onClick={onUncheckAll}
              disabled={!hasItems}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition shadow-sm"
            >
              <RefreshIcon className="w-4 h-4" />
              Restart
            </button>
            <button
              onClick={onClear}
              disabled={!hasItems}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-gray-200 text-red-600 dark:bg-gray-800 dark:border-gray-700 dark:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition shadow-sm"
            >
              <TrashIcon className="w-4 h-4" />
              Clear
            </button>
        </div>
      </div>
      
      {/* Input Area */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Search Bar */}
        <div className="relative group lg:col-span-1">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input 
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-4 bg-white dark:bg-gray-800 border-none rounded-2xl shadow-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
            />
        </div>

        {/* Add Item Form */}
        <form onSubmit={handleAddItem} className="relative group lg:col-span-3 flex flex-col md:flex-row gap-2 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm">
            <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <PlusCircleIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    placeholder="Add item name..."
                    className="block w-full pl-10 pr-3 py-2 bg-transparent border-none text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-0 text-sm h-full"
                />
            </div>
            
            <div className="flex gap-2">
                <input
                    type="number"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(e.target.value)}
                    placeholder="Qty"
                    className="w-16 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-xl border-none text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20"
                />
                <input
                    type="text"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    placeholder="Unit"
                    className="w-20 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-xl border-none text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20"
                />
            </div>

            <div className="flex items-center gap-2">
                <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="h-full py-2 pl-2 pr-8 bg-gray-50 dark:bg-gray-700 border-none rounded-xl text-gray-700 dark:text-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                {INGREDIENT_CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{cat}</option>)}
                </select>
                <button
                    type="submit" 
                    className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition shadow-sm flex-shrink-0"
                >
                    <PlusIcon className="w-5 h-5" />
                </button>
            </div>
        </form>
      </div>

      {/* Unified List Card */}
      {items.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center text-center p-10 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-dashed border-gray-300 dark:border-gray-700">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
               <span className="text-3xl">🛒</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Empty List</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
            Add ingredients from your recipes or type them in manually above.
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-10 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
             <h3 className="text-lg font-medium text-gray-900 dark:text-white">No items found</h3>
             <p className="text-gray-500 dark:text-gray-400 mt-1">
                No items match "{searchQuery}"
             </p>
             <button onClick={() => setSearchQuery('')} className="mt-4 text-blue-600 hover:underline">Clear Search</button>
          </div>
      ) : (
        <div className="flex-grow flex flex-col bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden relative">
           
           {/* Column Headers for larger screens */}
           <div className="hidden md:flex bg-gray-100/50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
               <div className="w-8"></div> {/* Checkbox placeholder */}
               <div className="flex-grow">Item</div>
               <div className="w-32 text-right">Quantity</div>
               <div className="w-32 text-right">Amount ({currency})</div>
               <div className="w-20"></div> {/* Actions placeholder */}
           </div>

           {/* Scrollable List */}
           <div className="flex-grow overflow-y-auto custom-scrollbar">
                {displayCategories.map((category) => (
                    <div 
                        key={category} 
                        className={`transition-all duration-300 ${groupedItems[category].length === 0 ? 'hidden' : 'block'} ${dragOverCategory === category ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                        onDragOver={(e) => handleDragOver(e, category)}
                        onDrop={(e) => handleDrop(e, category)}
                    >
                        <div className="bg-gray-50 dark:bg-gray-900/30 px-6 py-2 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
                             <h3 className={`text-xs font-bold uppercase tracking-wider transition-colors ${dragOverCategory === category ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'}`}>{category}</h3>
                        </div>
                        <ul className="min-h-[10px]">
                            {groupedItems[category].map((item, _index) => (
                                <li 
                                    key={item.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, String(item.id))}
                                    onDragOver={(e) => handleDragOver(e, category, String(item.id))}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => {
                                        e.stopPropagation();
                                        handleDrop(e, category, String(item.id));
                                    }}
                                    className={`
                                        group md:flex items-center px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-0 
                                        hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors gap-4
                                        ${draggedItemId === String(item.id) ? 'opacity-30 bg-gray-100' : ''}
                                        ${dragOverItemId === String(item.id) && draggedItemId !== String(item.id) ? 'border-t-2 border-t-blue-500' : ''}
                                    `}
                                >
                                    {/* Mobile layout wrapper (flex) -> Desktop changes to grid-like flex */}
                                    <div className="flex items-center w-full md:w-auto flex-grow gap-3">
                                        <div className="cursor-grab text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
                                            <DragHandleIcon className="w-5 h-5" />
                                        </div>

                                        <button 
                                            onClick={() => onToggleItem(String(item.id))}
                                            className={`
                                                flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200
                                                ${item.checked 
                                                    ? 'bg-blue-500 border-blue-500 text-white' 
                                                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                                                }
                                            `}
                                        >
                                            {item.checked && <CheckIcon className="w-3.5 h-3.5" />}
                                        </button>

                                        {editingId === String(item.id) ? (
                                            <div className="flex-grow flex flex-col md:flex-row items-center gap-2 animate-fadeIn w-full">
                                                <input 
                                                    type="text" 
                                                    value={editText} 
                                                    onChange={(e) => setEditText(e.target.value)}
                                                    className="w-full md:w-auto flex-grow px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border-transparent rounded-lg focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 transition-all"
                                                    autoFocus
                                                />
                                                <div className="flex gap-2">
                                                    <input 
                                                        type="number" 
                                                        value={editQuantity} 
                                                        onChange={(e) => setEditQuantity(e.target.value)}
                                                        className="w-16 px-2 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border-transparent rounded-lg"
                                                        placeholder="Qty"
                                                    />
                                                    <input 
                                                        type="text" 
                                                        value={editUnit} 
                                                        onChange={(e) => setEditUnit(e.target.value)}
                                                        className="w-16 px-2 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border-transparent rounded-lg"
                                                        placeholder="Unit"
                                                    />
                                                </div>
                                                <select
                                                    value={editCategory}
                                                    onChange={(e) => setEditCategory(e.target.value)}
                                                    className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 border-transparent rounded-lg text-sm"
                                                >
                                                    {INGREDIENT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                                </select>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={saveEdit} className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded-lg"><CheckIcon className="w-5 h-5" /></button>
                                                    <button onClick={cancelEdit} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg"><TrashIcon className="w-5 h-5" /></button>
                                                </div>
                                            </div>
                                        ) : (
                                            <span 
                                                className={`flex-grow text-sm transition-all cursor-pointer select-none ${item.checked ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}
                                                onClick={() => startEditing(item)}
                                            >
                                                {getItemName(item)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Columns for Qty/Price/Actions */}
                                    {editingId !== String(item.id) && (
                                        <div className="flex items-center gap-4 mt-2 md:mt-0 pl-11 md:pl-0 w-full md:w-auto justify-between md:justify-end">
                                            {/* Quantity Display */}
                                            <div className="text-sm text-gray-500 dark:text-gray-400 w-32 text-right">
                                                {getItemQuantityDisplay(item)}
                                            </div>

                                            {/* Price Input */}
                                            <div className="relative w-32 text-right">
                                                 <span className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{currency}</span>
                                                 <input 
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    value={item.price || ''}
                                                    onChange={(e) => handlePriceChange(String(item.id), e.target.value)}
                                                    className="w-24 pl-4 pr-1 py-1 text-right text-sm bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-gray-600 rounded focus:border-blue-500 focus:ring-0 focus:bg-gray-50 dark:focus:bg-gray-700 transition-all placeholder-transparent hover:placeholder-gray-300 dark:hover:placeholder-gray-600 focus:placeholder-gray-400"
                                                 />
                                            </div>

                                            {/* Actions */}
                                            <div className="w-20 flex justify-end">
                                                <button 
                                                    onClick={() => startEditing(item)}
                                                    className="p-2 text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
           </div>
           
           {/* Total Footer - Only shows if pricing is used */}
           {showPricing && (
             <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center backdrop-blur-md">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Estimated Total</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{currency}{totalPrice.toFixed(2)}</span>
             </div>
           )}
        </div>
      )}
      
      {/* Plus Icon needed for form but imported at top */}
      <div className="hidden"><PlusIcon /></div>
    </div>
  );
};

export default ShoppingListView;
