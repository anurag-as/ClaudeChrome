import { ErrorHandler } from '../../src/utils/ErrorHandler';
import { ErrorType } from '../../src/types';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorHandler = new ErrorHandler(true); // Enable debug mode for tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('handleError', () => {
    it('should log error with context to console', () => {
      const error = new Error('Test error');
      const context = 'PDF generation';

      errorHandler.handleError(error, context);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Claude Chat Exporter] Error in PDF generation:',
        error
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith('Stack trace:', error.stack);
    });

    it('should log error with different context', () => {
      const error = new Error('Parse failed');
      const context = 'content parsing';

      errorHandler.handleError(error, context);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Claude Chat Exporter] Error in content parsing:',
        error
      );
    });

    it('should log error stack trace', () => {
      const error = new Error('Stack test');
      error.stack = 'Error: Stack test\n    at test.ts:10:5';
      const context = 'testing';

      errorHandler.handleError(error, context);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Stack trace:', error.stack);
    });
  });

  describe('getUserMessage', () => {
    describe('parsing errors', () => {
      it('should return parsing error message for PARSING_ERROR type', () => {
        const error = new Error('Failed to parse') as any;
        error.errorType = ErrorType.PARSING_ERROR;

        const message = errorHandler.getUserMessage(error);

        expect(message).toBe('Failed to extract chat content. Please ensure you are on a Claude chat page with messages.');
      });

      it('should return parsing error message when error name matches', () => {
        const error = new Error('Parse failed');
        error.name = ErrorType.PARSING_ERROR;

        const message = errorHandler.getUserMessage(error);

        expect(message).toBe('Failed to extract chat content. Please ensure you are on a Claude chat page with messages.');
      });

      it('should return parsing error message for errors containing "parse"', () => {
        const error = new Error('Cannot parse DOM structure');

        const message = errorHandler.getUserMessage(error);

        expect(message).toBe('Failed to extract chat content. Please ensure you are on a Claude chat page with messages.');
      });

      it('should return parsing error message for errors containing "extract"', () => {
        const error = new Error('Failed to extract messages');

        const message = errorHandler.getUserMessage(error);

        expect(message).toBe('Failed to extract chat content. Please ensure you are on a Claude chat page with messages.');
      });
    });

    describe('PDF generation errors', () => {
      it('should return PDF error message for PDF_GENERATION_ERROR type', () => {
        const error = new Error('PDF failed') as any;
        error.errorType = ErrorType.PDF_GENERATION_ERROR;

        const message = errorHandler.getUserMessage(error);

        expect(message).toBe('Failed to generate PDF. The chat content may be too large or contain unsupported elements.');
      });

      it('should return PDF error message when error name matches', () => {
        const error = new Error('Generation failed');
        error.name = ErrorType.PDF_GENERATION_ERROR;

        const message = errorHandler.getUserMessage(error);

        expect(message).toBe('Failed to generate PDF. The chat content may be too large or contain unsupported elements.');
      });

      it('should return PDF error message for errors containing "pdf"', () => {
        const error = new Error('jsPDF initialization failed');

        const message = errorHandler.getUserMessage(error);

        expect(message).toBe('Failed to generate PDF. The chat content may be too large or contain unsupported elements.');
      });
    });

    describe('Markdown generation errors', () => {
      it('should return Markdown error message for MARKDOWN_GENERATION_ERROR type', () => {
        const error = new Error('Markdown failed') as any;
        error.errorType = ErrorType.MARKDOWN_GENERATION_ERROR;

        const message = errorHandler.getUserMessage(error);

        expect(message).toBe('Failed to generate Markdown. Please try again or contact support if the issue persists.');
      });

      it('should return Markdown error message when error name matches', () => {
        const error = new Error('Generation failed');
        error.name = ErrorType.MARKDOWN_GENERATION_ERROR;

        const message = errorHandler.getUserMessage(error);

        expect(message).toBe('Failed to generate Markdown. Please try again or contact support if the issue persists.');
      });

      it('should return Markdown error message for errors containing "markdown"', () => {
        const error = new Error('Markdown formatting error');

        const message = errorHandler.getUserMessage(error);

        expect(message).toBe('Failed to generate Markdown. Please try again or contact support if the issue persists.');
      });
    });

    describe('download errors', () => {
      it('should return download error message for DOWNLOAD_ERROR type', () => {
        const error = new Error('Download failed') as any;
        error.errorType = ErrorType.DOWNLOAD_ERROR;

        const message = errorHandler.getUserMessage(error);

        expect(message).toBe('Failed to download file. Please check your browser settings and ensure downloads are not blocked.');
      });

      it('should return download error message when error name matches', () => {
        const error = new Error('Failed');
        error.name = ErrorType.DOWNLOAD_ERROR;

        const message = errorHandler.getUserMessage(error);

        expect(message).toBe('Failed to download file. Please check your browser settings and ensure downloads are not blocked.');
      });

      it('should return download error message for errors containing "download"', () => {
        const error = new Error('Browser blocked download');

        const message = errorHandler.getUserMessage(error);

        expect(message).toBe('Failed to download file. Please check your browser settings and ensure downloads are not blocked.');
      });

      it('should return download error message for errors containing "blocked"', () => {
        const error = new Error('File blocked by browser');

        const message = errorHandler.getUserMessage(error);

        expect(message).toBe('Failed to download file. Please check your browser settings and ensure downloads are not blocked.');
      });
    });

    describe('unknown errors', () => {
      it('should return generic error message for UNKNOWN_ERROR type', () => {
        const error = new Error('Something went wrong') as any;
        error.errorType = ErrorType.UNKNOWN_ERROR;

        const message = errorHandler.getUserMessage(error);

        expect(message).toBe('An unexpected error occurred. Please try again or contact support if the issue persists.');
      });

      it('should return generic error message for unrecognized errors', () => {
        const error = new Error('Random error');

        const message = errorHandler.getUserMessage(error);

        expect(message).toBe('An unexpected error occurred. Please try again or contact support if the issue persists.');
      });

      it('should return generic error message for empty error message', () => {
        const error = new Error('');

        const message = errorHandler.getUserMessage(error);

        expect(message).toBe('An unexpected error occurred. Please try again or contact support if the issue persists.');
      });
    });

    describe('case insensitivity', () => {
      it('should match error keywords case-insensitively', () => {
        const error1 = new Error('PARSE failed');
        const error2 = new Error('Parse Failed');
        const error3 = new Error('pArSe failed');

        expect(errorHandler.getUserMessage(error1)).toContain('extract chat content');
        expect(errorHandler.getUserMessage(error2)).toContain('extract chat content');
        expect(errorHandler.getUserMessage(error3)).toContain('extract chat content');
      });

      it('should match PDF keyword case-insensitively', () => {
        const error1 = new Error('PDF generation failed');
        const error2 = new Error('pdf generation failed');
        const error3 = new Error('Pdf generation failed');

        expect(errorHandler.getUserMessage(error1)).toContain('generate PDF');
        expect(errorHandler.getUserMessage(error2)).toContain('generate PDF');
        expect(errorHandler.getUserMessage(error3)).toContain('generate PDF');
      });
    });
  });
});
