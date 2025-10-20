import { toast } from "sonner";

const isDev = import.meta.env.DEV;

/**
 * Centralized error handling to prevent sensitive information leakage
 * - Shows user-friendly messages in production
 * - Logs full details only in development
 */
export const handleError = (
  error: any,
  userMessage: string,
  context?: string
) => {
  // Show user-friendly message
  toast.error(userMessage);

  // Log safely based on environment
  if (isDev) {
    // Full details in development for debugging
    console.error(`[${context || 'Error'}]`, error);
  } else {
    // Minimal info in production - no sensitive data
    console.error(
      `[${context || 'Error'}]`,
      userMessage,
      error?.code || 'UNKNOWN'
    );
  }
};

/**
 * Map common database error codes to user-friendly messages
 */
const ERROR_MESSAGES: Record<string, string> = {
  '23505': 'This item already exists',
  '42501': 'You do not have permission to perform this action',
  '42P01': 'Resource not found',
  'PGRST116': 'Item not found',
  'PGRST301': 'Request failed',
  '23503': 'Cannot complete this action due to related data',
  '23502': 'Required information is missing',
};

/**
 * Get a user-friendly error message from error code
 */
export const getErrorMessage = (error: any, fallback: string): string => {
  return ERROR_MESSAGES[error?.code] || fallback;
};
