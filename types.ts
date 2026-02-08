

export enum MaterialType {
  STEEL_C45 = 'C45',
  ALUMINIUM_6061 = 'Alu 6061',
  STAINLESS_304 = 'SS 304',
  BRASS = 'Brass',
  PLASTIC_ABS = 'ABS'
}

export interface Dimensions {
  length: number;
  width: number;
  height: number;
}

// Helper to normalize German dates (DD.MM.YYYY) to ISO (YYYY-MM-DD)
export const normalizeDate = (dateStr: string | undefined): string | undefined => {
  if (!dateStr) return undefined;
  // Check for DD.MM.YYYY
  const germanDate = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (germanDate) {
    return `${germanDate[3]}-${germanDate[2]}-${germanDate[1]}`;
  }
  return dateStr;
};

export interface CalculationResult {
  volumeMm3: number;
  density: number; // g/cm3
  weightGrams: number;
  materialCost: number;
  unitPrice: number;
  ratePer100?: number; // New field for "Total Cost" from API (65.09)
  totalLineCost: number;
  // Breakdown fields from API
  baseMaterialId?: string;
  baseKeyDescription?: string; // New field for Base Key Description
  baseUnitCost?: number;
  modulesCost?: number;
  setupCost?: number;
  appliedModules?: string[]; // New field for "B1", "R39" etc.
  explanation?: string; // Formatted text from API
}

export interface ItemConfig {
  material_id?: string;
  standard?: string;
  form?: string;
  material?: string;
  dimensions?: { width: number; height: number; length: number };
  features?: Array<{ feature_type: string; spec: string }>;
  weight_per_unit?: number;
}

export interface LineItem {
  id: string;
  description: string;
  material: MaterialType | string; // Updated to allow string from config
  dimensions: Dimensions;
  quantity: number;
  unit: string;
  tolerance?: string;
  deliveryDate?: string;
  calculation?: CalculationResult;
  config?: ItemConfig; // New field for detailed specs
}

export interface RFQHeader {
  customerName: string;
  rfqNumber: string;
  rfqName: string; // Added from ref image
  rfqDescription: string; // Added from ref image
  partNumber: string; // Added from ref image
  documentDate: string;
  vendorName: string;
  responsiblePerson: string; // Added from ref image
  bidCloseDate: string;
  location: string;
  isAuction: boolean;
  customerNumber?: string;
  documentType?: string;
}

export interface QuoteComment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  type: 'internal' | 'supplier';
  role?: string; // To differentiate visual style
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadDate: string;
}

export interface RFQData {
  header: RFQHeader;
  lineItems: LineItem[];
  comments: QuoteComment[];
  attachments: Attachment[];
}

export type ViewMode = 'dashboard' | 'editor' | 'rfq_flow' | 'suppliers' | 'analytics' | 'demand_intelligence' | 'settings' | 'team' | 'portal_requests' | 'ai_chat';
export type EditorMode = 'upload' | 'verify';

export enum QuoteStatus {
  DRAFT = 'Draft',
  WIP = 'WIP', // From ref image
  REVIEW = 'In Review',
  APPROVED = 'Approved',
  SENT = 'Sent',
  ON_HOLD = 'On Hold' // From ref image
}

export interface SavedQuote extends RFQHeader {
  id: string;
  status: QuoteStatus;
  totalValue: number;
  lastModified: string;
  remark?: string; // From ref image
  templateRef?: string; // From ref image
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone?: string;
  address?: string;
  rating: number; // 1-5
  status: 'active' | 'inactive';
  category: string[];
}

// Pricing Configuration Types
export interface MaterialDef {
  id: MaterialType;
  name: string;
  density: number; // g/cm3
  costPerKg: number; // EUR per Kg
  lastUpdated: string;
}

export interface PricingConfig {
  materials: Record<MaterialType, MaterialDef>;
  globalMarkup: number; // Percentage
  currency: string;
}

// --- ANALYTICS TYPES ---

export type IntentLevel = 'Low (Browsing)' | 'Medium (Evaluation)' | 'High (Commitment)';

export interface InteractionEvent {
  id: string;
  sessionId: string;
  timestamp: number;
  action: 'page_view' | 'upload_attempt' | 'material_change' | 'dimension_edit' | 'quantity_change' | 'view_estimate' | 'submit_rfq';
  details?: string;
  metadata?: any;
}

export interface SessionIntent {
  sessionId: string;
  startTime: number;
  lastActive: number;
  actionsCount: number;
  intentScore: number;
  intentLevel: IntentLevel;
  currentConfig?: {
    material?: string;
    value?: number;
  };
}

// --- USER MANAGEMENT TYPES ---
export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  status: 'active' | 'pending';
  joinedDate: string;
  company?: string;
}

export interface ActivityLog {
  id: string;
  title: string;
  description: string;
  system: string;
  timestamp: string;
  status: 'success' | 'pending' | 'error';
  rawContent?: string; // To store extracted raw text/data
}

export type IngestionSource = 'native' | 'ocr' | 'hybrid';
