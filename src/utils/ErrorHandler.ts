import { ErrorType } from '../types';

/**
 * ErrorHandler provides centralized error handling and user-friendly error messages
 */
export class ErrorHandler {
  private debugMode: boolean;

  constructor(debugMode: boolean = false) {
    this.debugMode = debugMode;
  }

  /**
   * Handles an error by optionally logging it to the console with context
   * @param error - The error that occurred
   * @param context - Additional context about where/when the error occurred
   */
  handleError(error: Error, context: string): void {
    if (this.debugMode) {
      console.error(`[Claude Chat Exporter] Error in ${context}:`, error);
      console.error('Stack trace:', error.stack);
    }
  }

  /**
   * Gets a user-friendly error message based on the error type
   * @param error - The error to generate a message for
   * @returns A user-friendly error message
   */
  getUserMessage(error: Error): string {
    const errorMessage = error.message.toLowerCase();

    if (this.isErrorType(error, ErrorType.PARSING_ERROR) || errorMessage.includes('parse') || errorMessage.includes('extract')) {
      return 'Failed to extract chat content. Please ensure you are on a Claude chat page with messages.';
    }

    if (this.isErrorType(error, ErrorType.PDF_GENERATION_ERROR) || errorMessage.includes('pdf')) {
      return 'Failed to generate PDF. The chat content may be too large or contain unsupported elements.';
    }

    if (this.isErrorType(error, ErrorType.MARKDOWN_GENERATION_ERROR) || errorMessage.includes('markdown')) {
      return 'Failed to generate Markdown. Please try again or contact support if the issue persists.';
    }

    if (this.isErrorType(error, ErrorType.DOWNLOAD_ERROR) || errorMessage.includes('download') || errorMessage.includes('blocked')) {
      return 'Failed to download file. Please check your browser settings and ensure downloads are not blocked.';
    }

    return 'An unexpected error occurred. Please try again or contact support if the issue persists.';
  }

  /**
   * Checks if an error matches a specific error type
   * @param error - The error to check
   * @param errorType - The error type to match against
   * @returns True if the error matches the type
   */
  private isErrorType(error: Error, errorType: ErrorType): boolean {
    if ('errorType' in error && error.errorType === errorType) {
      return true;
    }

    if (error.name === errorType) {
      return true;
    }

    return false;
  }
}
