/**
 * Admin Diagnostics - Error tracking and schema compatibility for admin panel
 */

export interface DiagnosticError {
  query: string;
  message: string;
  code: string | null;
  hint: string | null;
  timestamp: Date;
}

export interface SchemaCheck {
  name: string;
  passed: boolean;
  error?: string;
}

// Store diagnostic errors in memory (visible in admin panel only)
let diagnosticErrors: DiagnosticError[] = [];
let schemaChecks: SchemaCheck[] = [];

const isDev = import.meta.env.DEV;

/**
 * Capture an admin error with full diagnostics
 */
export const captureAdminError = (
  query: string,
  error: any
): DiagnosticError => {
  const diagnosticError: DiagnosticError = {
    query,
    message: error?.message || String(error) || 'Unknown error',
    code: error?.code || null,
    hint: error?.hint || error?.details || null,
    timestamp: new Date(),
  };

  diagnosticErrors.push(diagnosticError);
  
  // Keep only last 20 errors
  if (diagnosticErrors.length > 20) {
    diagnosticErrors = diagnosticErrors.slice(-20);
  }

  // Log for debugging
  if (isDev) {
    console.error(`[Admin Diagnostic] Query: ${query}`, error);
  } else {
    console.error(`[Admin Error] ${query}: ${diagnosticError.code || 'UNKNOWN'}`);
  }

  return diagnosticError;
};

/**
 * Get all captured diagnostic errors
 */
export const getDiagnosticErrors = (): DiagnosticError[] => {
  return [...diagnosticErrors];
};

/**
 * Clear diagnostic errors
 */
export const clearDiagnosticErrors = () => {
  diagnosticErrors = [];
};

/**
 * Set schema check results
 */
export const setSchemaChecks = (checks: SchemaCheck[]) => {
  schemaChecks = checks;
};

/**
 * Get schema check results
 */
export const getSchemaChecks = (): SchemaCheck[] => {
  return [...schemaChecks];
};

/**
 * Generate a short error reference code for user display
 */
export const getErrorRefCode = (error: DiagnosticError): string => {
  const code = error.code || 'ERR';
  const ts = error.timestamp.getTime().toString(36).slice(-4).toUpperCase();
  return `${code}-${ts}`;
};

/**
 * Determine if an error is likely a schema mismatch
 */
export const isSchemaError = (error: any): boolean => {
  const message = error?.message?.toLowerCase() || '';
  const code = error?.code || '';
  
  return (
    message.includes('column') && message.includes('does not exist') ||
    message.includes('relation') && message.includes('does not exist') ||
    message.includes('could not find the') ||
    code === '42703' || // undefined_column
    code === '42P01' || // undefined_table
    code === 'PGRST200' // relationship not found
  );
};

/**
 * Get current environment info
 */
export const getEnvironmentInfo = () => {
  const hostname = window.location.hostname;
  const isPreview = hostname.includes('id-preview--');
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isPublished = !isPreview && !isLocalhost;
  
  return {
    hostname,
    environment: isLocalhost ? 'Local' : isPreview ? 'Preview (Test)' : 'Published (Live)',
    isLive: isPublished,
    isTest: isPreview || isLocalhost,
  };
};
