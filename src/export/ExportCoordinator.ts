import { ContentParser } from '../parser/ContentParser';
import { PDFExporter } from './PDFExporter';
import { MarkdownExporter } from './MarkdownExporter';
import { DownloadManager } from '../utils/DownloadManager';
import { ErrorHandler } from '../utils/ErrorHandler';
import { UIManager } from '../ui/UIManager';
import { DOMSelectors } from '../types';

/**
 * ExportCoordinator orchestrates the export process
 * Coordinates between ContentParser, exporters, and DownloadManager
 * Handles the complete export lifecycle including error handling
 */
export class ExportCoordinator {
  private contentParser: ContentParser;
  private pdfExporter: PDFExporter;
  private markdownExporter: MarkdownExporter;
  private downloadManager: DownloadManager;
  private errorHandler: ErrorHandler;
  private uiManager: UIManager | null;

  constructor(
    selectors: DOMSelectors,
    uiManager: UIManager | null,
    errorHandler?: ErrorHandler,
    downloadManager?: DownloadManager
  ) {
    this.contentParser = new ContentParser(selectors);
    this.pdfExporter = new PDFExporter();
    this.markdownExporter = new MarkdownExporter();
    this.downloadManager = downloadManager || new DownloadManager();
    this.errorHandler = errorHandler || new ErrorHandler();
    this.uiManager = uiManager;
  }

  /**
   * Export the current conversation to PDF format
   * Handles the complete export lifecycle with error handling
   */
  async exportToPDF(): Promise<void> {
    try {
      if (this.uiManager) {
        this.uiManager.hideError();
        this.uiManager.disableButtons();
        this.uiManager.showLoadingIndicator();
      }

      const conversation = this.contentParser.parseConversation();

      const pdfBlob = await this.pdfExporter.generate(conversation);

      const baseFilename = this.sanitizeFilename(conversation.title || 'claude-chat');
      const filename = this.downloadManager.generateFilename(baseFilename, 'pdf');

      this.downloadManager.downloadFile(pdfBlob, filename, 'application/pdf');

      if (this.uiManager) {
        this.uiManager.hideLoadingIndicator();
        this.uiManager.enableButtons();
      }
    } catch (error) {
      this.handleExportError(error, 'PDF export');
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Export the current conversation to Markdown format
   * Handles the complete export lifecycle with error handling
   */
  async exportToMarkdown(): Promise<void> {
    try {
      if (this.uiManager) {
        this.uiManager.hideError();
        this.uiManager.disableButtons();
        this.uiManager.showLoadingIndicator();
      }

      const conversation = this.contentParser.parseConversation();

      const markdownContent = this.markdownExporter.generate(conversation);

      const baseFilename = this.sanitizeFilename(conversation.title || 'claude-chat');
      const filename = this.downloadManager.generateFilename(baseFilename, 'md');

      this.downloadManager.downloadFile(markdownContent, filename, 'text/markdown');

      if (this.uiManager) {
        this.uiManager.hideLoadingIndicator();
        this.uiManager.enableButtons();
      }
    } catch (error) {
      this.handleExportError(error, 'Markdown export');
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Sanitize filename to remove invalid characters
   */
  private sanitizeFilename(title: string): string {
    // Remove emojis
    let sanitized = title.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    
    // Remove invalid filename characters
    sanitized = sanitized.replace(/[<>:"/\\|?*]/g, '');
    
    // Replace spaces with hyphens
    sanitized = sanitized.replace(/\s+/g, '-');
    
    // Remove leading/trailing hyphens
    sanitized = sanitized.replace(/^-+|-+$/g, '');
    
    // Limit length to 100 characters
    if (sanitized.length > 100) {
      sanitized = sanitized.substring(0, 100);
    }
    
    // Fallback if empty
    return sanitized || 'claude-chat';
  }

  /**
   * Handle errors during export process
   * @param error - The error that occurred
   * @param context - Context about where the error occurred
   */
  private handleExportError(error: unknown, context: string): void {
    const err = error instanceof Error ? error : new Error(String(error));

    this.errorHandler.handleError(err, context);

    const userMessage = this.errorHandler.getUserMessage(err);

    if (this.uiManager) {
      this.uiManager.hideLoadingIndicator();
      this.uiManager.enableButtons();
      this.uiManager.showError(userMessage);
    }
  }
}
