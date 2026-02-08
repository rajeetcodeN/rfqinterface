
import { RFQData, LineItem, MaterialType } from '../types';

// Live Render Backend
const API_BASE_URL = 'https://apirfq.onrender.com';
// For local testing use: 'http://localhost:8000';

export interface PythonBackendResponse {
    status: string;
    metadata: {
        source: string;
        document_type: string;
    };
    header: {
        supplier_name: string;
        customer_name: string;
        document_type: string;
        document_date: string;
        customer_number: string;
        rfq_number: string;
    };
    data: {
        requested_items: Array<{
            pos: string | number;
            article_name: string;
            supplier_material_number: string | null;
            customer_material_number: string | null;
            quantity: number;
            unit: string;
            delivery_date: string | null;
            config?: {
                material_id?: string;
                standard?: string;
                form?: string;
                material?: string;
                dimensions?: { width: number; height: number; length: number };
                features?: Array<{ feature_type: string; spec: string }>;
                weight_per_unit?: number;
            };
        }>;
    };
    debug?: {
        tokens_masked: number;
    };
}

/**
 * Uploads file to Python Backend for processing
 */
export const processFileWithPython = async (file: File): Promise<{ backendResponse: PythonBackendResponse }> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_BASE_URL}/process`, {
            method: 'POST',
            body: formData,
            // No Content-Type header needed, browser sets it for FormData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Backend Error (${response.status}): ${errorText}`);
        }

        const json = await response.json();
        return { backendResponse: json };

    } catch (error) {
        console.error("Python API Error:", error);
        throw error;
    }
};

/**
 * Maps the Python Backend response to the Frontend RFQData structure
 */
export const mapPythonResponseToRFQ = (response: PythonBackendResponse): Partial<RFQData> => {
    const { header, data } = response;

    // Map Line Items
    const lineItems: any[] = (data.requested_items || []).map((item, idx) => {
        // Parse dimensions from config if available
        let dims = { length: 0, width: 0, height: 0 };
        if (item.config?.dimensions) {
            dims = {
                length: item.config.dimensions.length || 0,
                width: item.config.dimensions.width || 0,
                height: item.config.dimensions.height || 0
            };
        }

        // Determine Material (prefer config, fallback to default)
        const material = item.config?.material || MaterialType.STEEL_C45;

        return {
            id: String(idx),
            description: item.article_name,
            material: material,
            quantity: Number(item.quantity) || 0,
            unit: item.unit || 'pcs',
            dimensions: dims,
            deliveryDate: item.delivery_date,
            config: item.config
        };
    });

    return {
        header: {
            customerName: header.customer_name,
            rfqNumber: header.rfq_number,
            documentDate: header.document_date,
            vendorName: header.supplier_name,
            rfqDescription: header.document_type,
            partNumber: header.customer_number,
            // Defaults
            rfqName: '',
            responsiblePerson: '',
            bidCloseDate: '',
            location: '',
            isAuction: false
        },
        lineItems
    };
};
