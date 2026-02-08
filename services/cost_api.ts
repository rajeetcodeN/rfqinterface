import { LineItem, CalculationResult } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/cost';

export interface CostApiRequest {
    requested_items: Array<{
        pos: string; // Mapped from Item ID
        article_name: string;
        quantity: number;
        config: any; // Sends the whole config object
    }>;
}

export interface CostApiResponseItem {
    status: string;
    custom_id: string; // Matches 'pos'
    match_type?: string;
    base_key?: { // New rich object
        id: string;
        description: string;
        specs: string[];
    };
    breakdown?: {
        base_key_id?: string; // Kept for backward compat if needed, but primary is base_key.id
        base_unit_cost?: number;
        modules_cost?: number;
        setup_cost?: number;
        total_unit_cost: number;
        total_cost: number;
        total_order_cost?: number; // Included in breakdown
        currency: string;
    };
    applied_modules?: string[]; // New field from API
    explanation?: string;
}

export type CostApiResponse = CostApiResponseItem[];

const VALID_FEATURE_TYPES = ['hole', 'thread', 'bore', 'coating', 'marking', 'heat_treatment', 'other'];

/**
 * Sanitizes config object to ensure all required fields have valid values
 */
const sanitizeConfig = (item: LineItem): any => {
    const config = item.config || {};

    // Ensure dimensions is always a proper object
    const dimensions = config.dimensions || item.dimensions || { width: 0, height: 0, length: 0 };
    const validDimensions = {
        width: typeof dimensions.width === 'number' ? dimensions.width : 0,
        height: typeof dimensions.height === 'number' ? dimensions.height : 0,
        length: typeof dimensions.length === 'number' ? dimensions.length : 0
    };

    // Sanitize features - map unknown types to 'other'
    const sanitizedFeatures = (config.features || []).map((f: any) => ({
        feature_type: VALID_FEATURE_TYPES.includes(f.feature_type) ? f.feature_type : 'other',
        spec: f.spec || ''
    }));

    return {
        material_id: config.material_id || '',
        standard: config.standard || '',
        form: config.form || 'A',
        material: config.material || item.material || 'C45',
        dimensions: validDimensions,
        features: sanitizedFeatures,
        weight_per_unit: config.weight_per_unit || 0
    };
};

/**
 * Checks if an item has valid data for cost calculation
 */
const isValidForCostCalc = (item: LineItem): boolean => {
    const dims = item.config?.dimensions || item.dimensions;
    // Skip items with zero dimensions
    if (!dims || (dims.width === 0 && dims.height === 0 && dims.length === 0)) {
        console.warn(`Skipping item "${item.description}" - zero dimensions`);
        return false;
    }
    // Skip placeholder items
    if (item.description.includes('{{') || item.description.includes('}}')) {
        console.warn(`Skipping item "${item.description}" - placeholder name`);
        return false;
    }
    return true;
};

/**
 * Sends extracted line items to the external Cost Calculation API.
 */
export const calculateCostsWithApi = async (items: LineItem[]): Promise<CostApiResponse> => {
    // Filter to only valid items
    const validItems = items.filter(isValidForCostCalc);

    if (validItems.length === 0) {
        console.warn("No valid items to send to Cost API");
        return [];
    }

    console.log(`=== COST API: Processing ${validItems.length} items individually ===`);

    // Process each item individually to handle partial failures
    const results = await Promise.allSettled(
        validItems.map(async (item): Promise<CostApiResponseItem> => {
            const payload: CostApiRequest = {
                requested_items: [{
                    pos: item.id,
                    article_name: item.description,
                    quantity: item.quantity,
                    config: sanitizeConfig(item)
                }]
            };

            console.log(`Processing item ${item.id}: ${item.description}`);

            const response = await fetch(`${API_BASE_URL}/calculate-batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.warn(`Item ${item.id} failed: ${errorText}`);
                // Return a fallback error response
                return {
                    status: 'error',
                    custom_id: item.id,
                    explanation: errorText
                };
            }

            const data = await response.json();
            console.log(`Item ${item.id} SUCCESS:`, data[0]);
            return data[0]; // Return first (only) item from batch response
        })
    );

    // Collect all results (both successful and failed)
    const allResults: CostApiResponse = results.map((result, idx) => {
        if (result.status === 'fulfilled') {
            return result.value;
        } else {
            // Promise rejected - create error response
            return {
                status: 'error',
                custom_id: validItems[idx].id,
                explanation: String(result.reason)
            };
        }
    });

    console.log("=== COST API FINAL RESULTS ===");
    console.log(JSON.stringify(allResults, null, 2));

    return allResults;
};

/**
 * Maps Cost API response back to LineItems
 */
export const applyCostResults = (items: LineItem[], apiResponse: CostApiResponse): LineItem[] => {
    return items.map(item => {
        const result = apiResponse.find(r => r.custom_id === item.id);

        if (!result || !result.breakdown) return item;

        return {
            ...item,
            calculation: {
                ...item.calculation, // Keep existing calc props (volume/density) if valid
                materialCost: result.breakdown.base_unit_cost || 0,
                unitPrice: result.breakdown.total_unit_cost,
                ratePer100: result.breakdown.total_cost,
                totalLineCost: result.breakdown.total_order_cost || result.breakdown.total_cost, // Corrected access path

                // New Breakdown fields from User PDF/Doc spec
                baseMaterialId: result.base_key?.id || result.breakdown.base_key_id,
                baseKeyDescription: result.base_key?.description, // Map description
                baseUnitCost: result.breakdown.base_unit_cost,
                modulesCost: result.breakdown.modules_cost,
                setupCost: result.breakdown.setup_cost,
                appliedModules: result.applied_modules || [], // Map applied_modules

                // Preserve physics calcs
                volumeMm3: item.calculation?.volumeMm3 || 0,
                density: item.calculation?.density || 0,
                weightGrams: item.calculation?.weightGrams || 0,
                explanation: result.explanation
            } as CalculationResult
        };
    });
};
