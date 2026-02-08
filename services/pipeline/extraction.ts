import { RFQData, IngestionSource } from '../../types';
import { uploadToS3, logProcessingStatus } from '../s3';
// import { maskPII } from './masking'; // Removed - redundant
// import { normalizeRFQData } from './normalization'; // Removed - redundant
import { logger } from '../logger';

/**
 * The Core AI Processing Chain
 * Orchestrates the entire pipeline from ingestion to normalization.
 */
export const runExtractionPipeline = async (file: File): Promise<{ data: Partial<RFQData>, rawContent: string, extractionRaw: string, source: IngestionSource }> => {
    // GDPR: Anonymize fileId and filename for pipeline processing
    const fileId = "doc_" + Date.now();
    logger.info(`Starting extraction pipeline (Python Backend)...`);
    logProcessingStatus(fileId, 'INGESTION', 'SUCCESS');

    try {
        // 1. Storage (Optional for this demo, keeping specific S3 call if needed or skipping)
        // await uploadToS3(file, "anonymized_document");

        // 2. Call Python Backend
        const { processFileWithPython, mapPythonResponseToRFQ } = await import('../python_api');
        const { backendResponse } = await processFileWithPython(file);

        logProcessingStatus(fileId, 'EXTRACTION', 'SUCCESS');
        logProcessingStatus(fileId, 'MASKING', 'SUCCESS'); // Handled by Python
        logProcessingStatus(fileId, 'NORMALIZATION', 'SUCCESS'); // Handled by Python

        // 3. Map Response
        const normalizedData = mapPythonResponseToRFQ(backendResponse);

        return {
            data: normalizedData,
            rawContent: JSON.stringify(backendResponse, null, 2),
            extractionRaw: JSON.stringify(backendResponse, null, 2),
            source: backendResponse.metadata.source as IngestionSource
        };

    } catch (error: any) {
        logProcessingStatus(fileId, 'PIPELINE', 'FAIL', error.message);
        logger.error("Pipeline failed", error);
        throw error;
    }
};
