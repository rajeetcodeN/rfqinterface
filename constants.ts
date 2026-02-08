
import { MaterialType } from './types';

// Density in g/cm^3
export const MATERIAL_DENSITY: Record<MaterialType, number> = {
  [MaterialType.STEEL_C45]: 7.85,
  [MaterialType.ALUMINIUM_6061]: 2.70,
  [MaterialType.STAINLESS_304]: 8.00,
  [MaterialType.BRASS]: 8.73,
  [MaterialType.PLASTIC_ABS]: 1.04,
};

// Base cost per gram in EUR (Mock values for calculation)
export const MATERIAL_COST_PER_GRAM: Record<MaterialType, number> = {
  [MaterialType.STEEL_C45]: 0.0015, // 1.50 EUR / kg
  [MaterialType.ALUMINIUM_6061]: 0.0028,
  [MaterialType.STAINLESS_304]: 0.0045,
  [MaterialType.BRASS]: 0.0060,
  [MaterialType.PLASTIC_ABS]: 0.0008,
};

export const INITIAL_HEADER = {
  customerName: '',
  rfqNumber: '',
  rfqName: '',
  rfqDescription: '',
  partNumber: '',
  documentDate: new Date().toISOString().split('T')[0],
  vendorName: 'Nosta GmbH',
  responsiblePerson: '',
  bidCloseDate: '',
  location: 'Ad-Electronic City (019028000)',
  isAuction: false,
  customerNumber: '',
  documentType: 'Purchase Order'
};