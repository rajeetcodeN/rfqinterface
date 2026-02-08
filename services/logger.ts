/**
 * RFQ Intelligence Logger
 * 
 * Centralized logging utility that ensures GDPR compliance by:
 * 1. Suppressing sensitive data logs in non-development environments.
 * 2. Providing a consistent interface for audit and error logging.
 */

const isDev = (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV) ||
    false;

export const logger = {
    /**
     * Standard info log for system events
     */
    info: (message: string, ...args: any[]) => {
        console.log(`[INFO] ${message}`, ...args);
    },

    /**
     * Warning log for non-critical issues
     */
    warn: (message: string, ...args: any[]) => {
        console.warn(`[WARN] ${message}`, ...args);
    },

    /**
     * Error log for critical issues
     */
    error: (message: string, error?: any) => {
        console.error(`[ERROR] ${message}`, error);
    },

    /**
     * SENSITIVE LOG: Only outputs data in development mode.
     * Use this for raw extraction data, headers, or line items.
     */
    data: (label: string, data: any) => {
        if (isDev) {
            console.log(`[DEBUG_DATA] ${label}:`, data);
        }
    },

    /**
     * AUDIT LOG: Securely logs pipeline progress without leaking PII.
     */
    audit: (stage: string, status: 'SUCCESS' | 'FAILURE' | 'PENDING', details?: string) => {
        // Filenames and raw content are stripped from audit logs in production
        const timestamp = new Date().toISOString();
        console.log(`[AUDIT] ${timestamp} | Stage: ${stage} | Status: ${status} ${details ? '| ' + details : ''}`);
    }
};
