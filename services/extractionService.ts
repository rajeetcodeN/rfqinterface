import { RFQData, MaterialType } from "../types";

// Mock extraction service that simulates AI processing
export const extractRFQData = async (base64Image: string, mimeType: string) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Return consistent mock data regardless of input
    return {
        customerName: "Acme Manufacturing (Mock)",
        rfqNumber: "RFQ-MOCK-2024",
        documentDate: new Date().toISOString().split('T')[0],
        lineItems: [
            {
                description: "Machined Casing (Extracted)",
                material: "Steel C45",
                quantity: 50,
                length: 120,
                width: 80,
                height: 25,
                unit: "Stk",
                deliveryDate: "2024-12-31",
                tolerance: "ISO 2768-m"
            },
            {
                description: "Mounting Plate",
                material: "Alu 6061",
                quantity: 100,
                length: 200,
                width: 200,
                height: 10,
                unit: "Stk",
                deliveryDate: "2024-12-31",
                tolerance: "H7"
            }
        ]
    };
};

export const chatWithQuote = async (rfqData: RFQData, userMessage: string, history: { role: string, text: string }[]) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return "I am a mock AI assistant. Real AI integration has been disabled. I cannot analyze the specific quote data dynamically.";
};
