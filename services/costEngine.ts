import { LineItem, CalculationResult, Dimensions, MaterialType, PricingConfig } from '../types';

/**
 * Calculates physics-based cost and weight.
 * Deterministic: Same input always returns same output.
 * Now accepts a dynamic pricing configuration.
 */
export const calculateLineItem = (
    material: MaterialType,
    dimensions: Dimensions,
    quantity: number,
    config: PricingConfig
): CalculationResult => {
    const materialDef = config.materials[material];

    // Fallbacks if config is missing (safety)
    const density = materialDef ? materialDef.density : 7.85;
    const costPerKg = materialDef ? materialDef.costPerKg : 1.50;
    const markup = config.globalMarkup || 0;

    // Convert Cost/Kg to Cost/Gram
    const costPerGram = costPerKg / 1000;

    // Volume in mm^3
    const volumeMm3 = dimensions.length * dimensions.width * dimensions.height;

    // Convert Volume to cm^3 for weight calc (1 cm^3 = 1000 mm^3)
    const volumeCm3 = volumeMm3 / 1000;

    // Weight in grams
    const weightGrams = volumeCm3 * density;

    // Material Cost per unit (Raw)
    const rawMaterialCostPerUnit = weightGrams * costPerGram;

    // Apply Markup
    const materialCostPerUnit = rawMaterialCostPerUnit * (1 + (markup / 100));

    // Total Line Cost
    const totalLineCost = materialCostPerUnit * quantity;

    return {
        volumeMm3,
        density,
        weightGrams,
        materialCost: materialCostPerUnit,
        totalLineCost
    };
};

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
};

export const formatNumber = (num: number, decimals = 2) => {
    return new Intl.NumberFormat('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(num);
};
