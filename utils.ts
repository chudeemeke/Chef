import type { Ingredient } from './types';

// More robust fraction formatting
export const formatQuantity = (num: number): string => {
    if (num > 1) {
        const integerPart = Math.floor(num);
        const fractionalPart = num - integerPart;
        if (fractionalPart === 0) return integerPart.toString();
        return `${integerPart} ${formatQuantity(fractionalPart)}`;
    }

    const tolerance = 1.0E-6;
    let h1 = 1; let h2 = 0;
    let k1 = 0; let k2 = 1;
    let b = num;
    do {
        let a = Math.floor(b);
        let aux = h1; h1 = a * h1 + h2; h2 = aux;
        aux = k1; k1 = a * k1 + k2; k2 = aux;
        b = 1 / (b - a);
    } while (Math.abs(num - h1 / k1) > num * tolerance);

    if (k1 > 16) { // Limit denominator for readability
      return parseFloat(num.toFixed(2)).toString();
    }
    
    if (h1 === 0) return "0";

    return `${h1}/${k1}`;
}

// Simple unit conversion logic
const CONVERSIONS: Record<string, { to: string; factor: number }> = {
    // Volume
    'ml': { to: 'fl oz', factor: 0.033814 },
    'l': { to: 'quart', factor: 1.05669 },
    'tsp': { to: 'tsp', factor: 1 },
    'tbsp': { to: 'tbsp', factor: 1 },
    'cup': { to: 'cup', factor: 1 },
    'cups': { to: 'cups', factor: 1 },
    // Weight
    'g': { to: 'oz', factor: 0.035274 },
    'kg': { to: 'lb', factor: 2.20462 },
    // Imperial back to Metric
    'fl oz': { to: 'ml', factor: 29.5735 },
    'quart': { to: 'l', factor: 0.946353 },
    'oz': { to: 'g', factor: 28.3495 },
    'lb': { to: 'kg', factor: 0.453592 },
};

const isMetric = (unit: string) => ['ml', 'l', 'g', 'kg'].includes(unit.toLowerCase());
const isImperial = (unit: string) => ['fl oz', 'quart', 'oz', 'lb', 'tsp', 'tbsp', 'cup', 'cups'].includes(unit.toLowerCase());

export const convertIngredient = (
    ingredient: Ingredient,
    targetSystem: 'metric' | 'imperial'
): Ingredient => {
    const unit = (ingredient.unit || '').toLowerCase();
    
    if (targetSystem === 'imperial' && isMetric(unit) && CONVERSIONS[unit]) {
        return {
            ...ingredient,
            quantity: ingredient.quantity * CONVERSIONS[unit].factor,
            unit: CONVERSIONS[unit].to,
        };
    }

    if (targetSystem === 'metric' && isImperial(unit) && CONVERSIONS[unit]) {
         return {
            ...ingredient,
            quantity: ingredient.quantity * CONVERSIONS[unit].factor,
            unit: CONVERSIONS[unit].to,
        };
    }

    return ingredient; // Return original if no conversion is needed/possible
};


export const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const INGREDIENT_CATEGORIES = [
    'Produce',
    'Dairy',
    'Meat',
    'Seafood',
    'Pantry',
    'Spices',
    'Bakery',
    'Other',
];
