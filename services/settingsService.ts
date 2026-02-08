import { PricingConfig, MaterialType } from '../types';

const STORAGE_KEY = 'dbt_pricing_config';

const DEFAULT_PRICING: PricingConfig = {
  currency: 'EUR',
  globalMarkup: 0,
  materials: {
    [MaterialType.STEEL_C45]: { id: MaterialType.STEEL_C45, name: 'Steel C45 (1.0503)', density: 7.85, costPerKg: 1.50, lastUpdated: new Date().toISOString() },
    [MaterialType.ALUMINIUM_6061]: { id: MaterialType.ALUMINIUM_6061, name: 'Aluminium 6061', density: 2.70, costPerKg: 2.80, lastUpdated: new Date().toISOString() },
    [MaterialType.STAINLESS_304]: { id: MaterialType.STAINLESS_304, name: 'Stainless Steel 304', density: 8.00, costPerKg: 4.50, lastUpdated: new Date().toISOString() },
    [MaterialType.BRASS]: { id: MaterialType.BRASS, name: 'Brass (CuZn39Pb3)', density: 8.73, costPerKg: 6.00, lastUpdated: new Date().toISOString() },
    [MaterialType.PLASTIC_ABS]: { id: MaterialType.PLASTIC_ABS, name: 'Plastic ABS', density: 1.04, costPerKg: 0.80, lastUpdated: new Date().toISOString() },
  }
};

export const getPricingConfig = (): PricingConfig => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load pricing config', e);
  }
  return DEFAULT_PRICING;
};

export const savePricingConfig = (config: PricingConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save pricing config', e);
  }
};