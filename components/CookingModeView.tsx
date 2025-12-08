
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Recipe, Timer, Ingredient } from '../types';
import { VolumeUpIcon, XIcon, ShareIcon, TimerIcon, PlusCircleIcon, TrashIcon, PlayIcon, PauseIcon } from './icons';
import { formatQuantity, convertIngredient, formatTime } from '../utils';
import { useShare } from '../hooks/useShare';

interface CookingModeViewProps {
  recipe: Recipe;
  onExit: () => void;
  onAddToShoppingList: (itemText: string, category: string, ingredient?: Ingredient) => void;
  onShowToast: (message: string) => void;
}

const TimerDisplay: React.FC<{
    timer: Timer;
    onToggle: (id: number) => void;
    onDelete: (id: number) => void;
}> = ({ timer, onToggle, onDelete }) => {
    const progress = (timer.initialDuration - timer.remainingSeconds) / timer.initialDuration * 100;

    return (
        <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-between gap-2 transition-colors shadow-sm">
            <div className="flex-grow">
                <div className="flex justify-between items-baseline">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{timer.label}</span>
                    <span className="text-lg font-mono font-semibold text-gray-900 dark:text-white">{formatTime(timer.remainingSeconds)}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mt-2">
                    <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000 ease-linear" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
            <button onClick={() => onToggle(timer.id)} className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                {timer.isRunning ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
            </button>
            <button onClick={() => onDelete(timer.id)} className="p-1.5 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors">
                <TrashIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

// Component to render instruction text with clickable timer buttons
const SmartInstruction: React.FC<{ text: string; onAddTimer: (duration: number, label: string) => void }> = ({ text, onAddTimer }) => {
    // Regex to match durations like "10 minutes", "1 hour", "30-45 seconds"
    const timeRegex = /\b(\d+(?:-\d+)?)\s*(min|minute|minutes|sec|second|seconds|hr|hour|hours)\b/gi;
    
    const parts = [];
    let lastIndex = 0;
    let match;

    const generateSmartLabel = (fullText: string, startIndex: number, durationText: string): string => {
        // Look backwards from the time to find the action verb
        // Grab up to 40 characters before the time
        const lookbackStart = Math.max(0, startIndex - 40);
        const prefix = fullText.substring(lookbackStart, startIndex).trim();
        
        // Split by sentence delimiters to avoid grabbing context from previous sentence
        const sentenceParts = prefix.split(/[.;?!]/);
        const currentSentenceContext = sentenceParts[sentenceParts.length - 1].trim();

        if (!currentSentenceContext) return `Timer: ${durationText}`;

        // Get the last few words (up to 3)
        const words = currentSentenceContext.split(/\s+/);
        let actionLabel = words.slice(-3).join(' ');

        // Clean up common prepositions at the end of the label
        actionLabel = actionLabel.replace(/\s+(for|about|until|approx|approximately)$/i, '');
        
        // Capitalize first letter
        if (actionLabel) {
            return actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1);
        }
        
        return `Timer: ${durationText}`;
    };

    while ((match = timeRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }

        const fullMatch = match[0];
        const durationStr = match[1].split('-')[0]; // Take lower bound if range
        const unitStr = match[2].toLowerCase();
        
        let multiplier = 60; // default to minutes
        if (unitStr.startsWith('sec')) multiplier = 1;
        if (unitStr.startsWith('hr') || unitStr.startsWith('hour')) multiplier = 3600;

        const duration = parseInt(durationStr, 10) * multiplier;
        const smartLabel = generateSmartLabel(text, match.index, fullMatch);

        parts.push(
            <button
                key={match.index}
                onClick={() => onAddTimer(duration, smartLabel)}
                className="inline-flex items-center mx-1 px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors cursor-pointer border border-blue-200 dark:border-blue-700/50 align-baseline"
                title={`Start timer: ${smartLabel}`}
            >
                <TimerIcon className="w-3.5 h-3.5 mr-1" />
                {fullMatch}
            </button>
        );

        lastIndex = match.index + fullMatch.length;
    }

    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return <p className="text-xl md:text-2xl lg:text-3xl font-light text-gray-900 dark:text-gray-100 leading-normal">{parts}</p>;
};

const CookingModeView: React.FC<CookingModeViewProps> = ({ recipe, onExit, onAddToShoppingList, onShowToast }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [servings, setServings] = useState(recipe.servings);
  const [unitSystem, setUnitSystem] = useState<'imperial' | 'metric'>('imperial');
  const [timers, setTimers] = useState<Timer[]>([]);
  const [newTimerLabel, setNewTimerLabel] = useState('');
  const [newTimerMinutes, setNewTimerMinutes] = useState('');

  // Use the new Sharing Hook
  const { share } = useShare(onShowToast);

  // Timer countdown logic
  useEffect(() => {
    const interval = setInterval(() => {
        setTimers(prevTimers => {
            let timersChanged = false;
            const updatedTimers = prevTimers.map(timer => {
                if (timer.isRunning && timer.remainingSeconds > 0) {
                    timersChanged = true;
                    return { ...timer, remainingSeconds: timer.remainingSeconds - 1 };
                }
                if (timer.isRunning && timer.remainingSeconds === 1) { 
                     try {
                        new Audio('https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3').play();
                     } catch (e) {
                         console.error("Failed to play timer sound", e);
                     }
                }
                if (timer.isRunning && timer.remainingSeconds === 0) {
                    timersChanged = true;
                    return { ...timer, isRunning: false };
                }
                return timer;
            });
            return timersChanged ? updatedTimers : prevTimers;
        });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  const readAloud = useCallback((text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }, []);

  const handleNextStep = () => {
    if (currentStep < recipe.instructions.length - 1) setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleShare = async () => {
      const ingredientText = recipe.ingredients.map(i => `- ${formatQuantity(i.quantity)} ${i.unit} ${i.name}`).join('\n');
      const instructionsText = recipe.instructions.map((step, i) => `${i+1}. ${step}`).join('\n');
      
      const shareText = `${recipe.description}\n\nIngredients:\n${ingredientText}\n\nInstructions:\n${instructionsText}`;

      await share({
          title: recipe.name,
          text: shareText,
          url: window.location.href
      });
  };

  const addTimer = (duration: number, label: string) => {
      const newTimer: Timer = {
          id: Date.now(),
          label: label,
          initialDuration: duration,
          remainingSeconds: duration,
          isRunning: true,
      };
      setTimers(prev => [...prev, newTimer]);
      onShowToast(`${label} started!`);
  };

  const handleAddTimerManual = (e: React.FormEvent) => {
      e.preventDefault();
      const duration = parseInt(newTimerMinutes, 10) * 60;
      if (duration > 0 && newTimerLabel) {
          addTimer(duration, newTimerLabel);
          setNewTimerLabel('');
          setNewTimerMinutes('');
      }
  };

  const handleToggleTimer = (id: number) => {
      setTimers(timers.map(t => t.id === id ? { ...t, isRunning: !t.isRunning } : t));
  };
  
  const handleDeleteTimer = (id: number) => {
      setTimers(timers.filter(t => t.id !== id));
  };

  const handleClearAllTimers = () => {
      if (timers.length > 0 && window.confirm("Are you sure you want to clear all active timers?")) {
          setTimers([]);
          onShowToast("All timers cleared");
      }
  };
  
  const scaleFactor = servings / recipe.servings;
  const processedIngredients = useMemo(() => {
      return recipe.ingredients
          .map(ing => ({ ...ing, quantity: ing.quantity * scaleFactor }))
          .map(ing => convertIngredient(ing, unitSystem));
  }, [recipe.ingredients, scaleFactor, unitSystem]);


  const handleAddToShoppingListClick = (ingredient: (typeof processedIngredients)[0]) => {
      const originalIngredient = recipe.ingredients.find(i => i.name === ingredient.name);
      
      // Use just name for text
      const text = ingredient.name;
      
      const ingredientData: Ingredient = {
          ...ingredient,
          category: originalIngredient?.category || 'Other',
          isPresent: false
      };
      
      onAddToShoppingList(text, ingredientData.category, ingredientData);
  };

  const currentInstruction = recipe.instructions[currentStep];

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Left Panel: Ingredients, Timers */}
      <div className="w-full md:w-2/5 lg:w-96 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-6 flex flex-col transition-colors duration-200 overflow-hidden">
        <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight pr-4">{recipe.name}</h2>
            <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={handleShare} className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition">
                    <ShareIcon className="w-5 h-5" />
                </button>
                <button onClick={onExit} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition">
                    <XIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
        
        {/* Ingredients Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6 flex-shrink-0">
            <div className="flex flex-col gap-4 mb-4">
                 <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Ingredients</h3>
                    <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-lg border border-gray-300 dark:border-gray-700">
                        <button onClick={() => setUnitSystem('imperial')} className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${unitSystem === 'imperial' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Imp</button>
                        <button onClick={() => setUnitSystem('metric')} className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${unitSystem === 'metric' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Met</button>
                    </div>
                 </div>
                 
                 <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between shadow-sm">
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Servings</span>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setServings(s => Math.max(1, s-1))} 
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-gray-600 transition-colors font-bold"
                        >
                            -
                        </button>
                        <span className="text-lg font-bold text-gray-900 dark:text-white w-6 text-center">{servings}</span>
                        <button 
                            onClick={() => setServings(s => s+1)} 
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-gray-600 transition-colors font-bold"
                        >
                            +
                        </button>
                    </div>
                 </div>
            </div>

            <ul className="space-y-3 overflow-y-auto max-h-60 pr-2 custom-scrollbar">
              {processedIngredients.map((ing, index) => {
                 const originalIsPresent = recipe.ingredients[index]?.isPresent;
                 return (
                    <li key={index} className="flex justify-between items-start text-sm group">
                      <span className={`text-gray-700 dark:text-gray-300 leading-snug transition-opacity ${!originalIsPresent ? 'opacity-60 line-through decoration-gray-400' : ''}`}>
                        <span className="font-bold text-gray-900 dark:text-white">{formatQuantity(ing.quantity)} {ing.unit}</span> {ing.name}
                      </span>
                      {!originalIsPresent && (
                        <button
                          onClick={() => handleAddToShoppingListClick(ing)}
                          className="flex-shrink-0 ml-2 opacity-100 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-200 font-semibold px-2.5 py-1 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-all shadow-sm"
                          aria-label={`Add ${ing.name} to shopping list`}
                        >
                          + Add
                        </button>
                      )}
                    </li>
                 );
              })}
            </ul>
        </div>
        
        {/* Timers Section */}
        <div className="pt-6 flex-grow flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <TimerIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" /> Timers
                </h3>
                {timers.length > 0 && (
                    <button 
                        onClick={handleClearAllTimers}
                        className="text-xs font-semibold text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    >
                        Clear All
                    </button>
                )}
            </div>

            <div className="flex-grow overflow-y-auto space-y-3 pr-2 mb-4 custom-scrollbar">
                {timers.length > 0 ? (
                    timers.map(timer => <TimerDisplay key={timer.id} timer={timer} onToggle={handleToggleTimer} onDelete={handleDeleteTimer} />)
                ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
                        <p className="text-sm font-medium">No active timers</p>
                        <p className="text-xs mt-1 text-center px-4">Tap highlighted times in instructions to start</p>
                    </div>
                )}
            </div>

            <form onSubmit={handleAddTimerManual} className="flex gap-2 items-center mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
                 <input
                    type="text"
                    value={newTimerLabel}
                    onChange={e => setNewTimerLabel(e.target.value)}
                    placeholder="Timer label"
                    className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                />
                <div className="relative w-20 flex-shrink-0">
                    <input
                        type="number"
                        value={newTimerMinutes}
                        onChange={e => setNewTimerMinutes(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                        min="1"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500 pointer-events-none">m</span>
                </div>
                <button type="submit" className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"><PlusCircleIcon className="w-5 h-5"/></button>
            </form>
        </div>

      </div>

      {/* Right Panel: Instructions */}
      <div className="flex-grow flex flex-col p-6 md:p-12 justify-between bg-white dark:bg-gray-800 transition-colors duration-200 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full">
          <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-6 tracking-wide uppercase flex justify-between items-center">
            <span>STEP {currentStep + 1} / {recipe.instructions.length}</span>
          </p>
          <SmartInstruction text={currentInstruction} onAddTimer={addTimer} />
        </div>
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button 
                onClick={handlePrevStep} 
                disabled={currentStep === 0} 
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
                Previous
            </button>
            <button 
                onClick={handleNextStep} 
                disabled={currentStep === recipe.instructions.length - 1} 
                className="flex-1 sm:flex-none px-8 py-3 rounded-xl bg-blue-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30"
            >
                Next Step
            </button>
          </div>
          <button onClick={() => readAloud(currentInstruction)} className="w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-3 rounded-xl bg-green-600 dark:bg-green-700 text-white font-bold hover:bg-green-700 dark:hover:bg-green-600 transition-all shadow-lg shadow-green-500/30">
            <VolumeUpIcon className="w-5 h-5" />
            <span>Read Aloud</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookingModeView;
