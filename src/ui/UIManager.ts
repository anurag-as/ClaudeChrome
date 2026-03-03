/**
 * UIManager - Manages all UI elements injected into the Claude chat page
 * 
 * Responsibilities:
 * - Inject export buttons into the page
 * - Show/hide loading indicators
 * - Display error messages
 * - Manage button states (enabled/disabled)
 * - Handle keyboard shortcuts
 */

export class UIManager {
  private container: HTMLDivElement | null = null;
  private pdfButton: HTMLButtonElement | null = null;
  private markdownButton: HTMLButtonElement | null = null;
  private loadingIndicator: HTMLDivElement | null = null;
  private errorDisplay: HTMLDivElement | null = null;
  private onPdfExport?: () => Promise<void>;
  private onMarkdownExport?: () => Promise<void>;
  private keyboardShortcutsEnabled: boolean = true;

  /**
   * Initialize the UI by injecting all elements into the page
   * @param onPdfExport - Callback function for PDF export
   * @param onMarkdownExport - Callback function for Markdown export
   */
  initialize(
    onPdfExport: () => Promise<void>,
    onMarkdownExport: () => Promise<void>
  ): void {
    this.onPdfExport = onPdfExport;
    this.onMarkdownExport = onMarkdownExport;

    this.container = this.createContainer();
    
    this.pdfButton = this.createExportButton('PDF', 'pdf');
    this.markdownButton = this.createExportButton('Markdown', 'markdown');
    
    this.loadingIndicator = this.createLoadingIndicator();
    
    this.errorDisplay = this.createErrorDisplay();
    
    this.container.appendChild(this.pdfButton);
    this.container.appendChild(this.markdownButton);
    this.container.appendChild(this.loadingIndicator);
    this.container.appendChild(this.errorDisplay);
    
    document.body.appendChild(this.container);
    
    this.setupKeyboardShortcuts();
  }

  /**
   * Create the main container for all UI elements
   */
  private createContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.id = 'claude-chat-exporter-ui';
    container.setAttribute('role', 'toolbar');
    container.setAttribute('aria-label', 'Chat export controls');
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    `;
    return container;
  }

  /**
   * Create an export button
   * @param label - Button label text
   * @param type - Export type ('pdf' or 'markdown')
   */
  private createExportButton(label: string, type: 'pdf' | 'markdown'): HTMLButtonElement {
    const button = document.createElement('button');
    const shortcut = type === 'pdf' ? 'Ctrl+Shift+P' : 'Ctrl+Shift+M';
    button.textContent = `Export as ${label}`;
    button.className = `claude-exporter-btn claude-exporter-btn-${type}`;
    button.setAttribute('aria-label', `Export conversation as ${label} (${shortcut})`);
    button.setAttribute('title', `Export as ${label} (${shortcut})`);
    button.style.cssText = `
      padding: 10px 16px;
      background-color: #2563eb;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      white-space: nowrap;
      outline: none;
    `;
    
    button.addEventListener('focus', () => {
      if (!button.disabled) {
        button.style.outline = '2px solid #60a5fa';
        button.style.outlineOffset = '2px';
      }
    });
    
    button.addEventListener('blur', () => {
      button.style.outline = 'none';
    });
    
    button.addEventListener('mouseenter', () => {
      if (!button.disabled) {
        button.style.backgroundColor = '#1d4ed8';
        button.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.15)';
        button.style.transform = 'translateY(-1px)';
      }
    });
    
    button.addEventListener('mouseleave', () => {
      if (!button.disabled) {
        button.style.backgroundColor = '#2563eb';
        button.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
        button.style.transform = 'translateY(0)';
      }
    });
    
    button.addEventListener('mousedown', () => {
      if (!button.disabled) {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
      }
    });
    
    button.addEventListener('mouseup', () => {
      if (!button.disabled) {
        button.style.transform = 'translateY(-1px)';
        button.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.15)';
      }
    });
    
    button.addEventListener('click', async () => {
      if (type === 'pdf' && this.onPdfExport) {
        await this.onPdfExport();
      } else if (type === 'markdown' && this.onMarkdownExport) {
        await this.onMarkdownExport();
      }
    });
    
    return button;
  }

  /**
   * Create the loading indicator element
   */
  private createLoadingIndicator(): HTMLDivElement {
    const indicator = document.createElement('div');
    indicator.className = 'claude-exporter-loading';
    indicator.setAttribute('role', 'status');
    indicator.setAttribute('aria-live', 'polite');
    indicator.style.cssText = `
      display: none;
      padding: 10px 16px;
      background-color: #f3f4f6;
      border-radius: 6px;
      font-size: 14px;
      color: #374151;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    `;
    indicator.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; justify-content: center;">
        <div class="spinner" style="
          width: 16px;
          height: 16px;
          border: 2px solid #e5e7eb;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        "></div>
        <span>Exporting...</span>
      </div>
    `;
    
    this.addSpinnerAnimation();
    
    return indicator;
  }

  /**
   * Create the error display element
   */
  private createErrorDisplay(): HTMLDivElement {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'claude-exporter-error';
    errorDiv.setAttribute('role', 'alert');
    errorDiv.setAttribute('aria-live', 'assertive');
    errorDiv.style.cssText = `
      display: none;
      padding: 12px 16px;
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      font-size: 14px;
      color: #991b1b;
      max-width: 300px;
      word-wrap: break-word;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    `;
    return errorDiv;
  }

  /**
   * Add CSS animation for spinner
   */
  private addSpinnerAnimation(): void {
    if (document.getElementById('claude-exporter-spinner-animation')) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'claude-exporter-spinner-animation';
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Set up keyboard shortcuts for export actions
   * Ctrl+Shift+P: Export as PDF
   * Ctrl+Shift+M: Export as Markdown
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      if (!this.keyboardShortcutsEnabled) return;
      
      const target = event.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.isContentEditable;
      
      if (isInputField) return;
      
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        if (this.pdfButton && !this.pdfButton.disabled && this.onPdfExport) {
          this.onPdfExport();
        }
      }
      
      if (event.ctrlKey && event.shiftKey && event.key === 'M') {
        event.preventDefault();
        if (this.markdownButton && !this.markdownButton.disabled && this.onMarkdownExport) {
          this.onMarkdownExport();
        }
      }
    });
  }

  /**
   * Show the loading indicator
   */
  showLoadingIndicator(): void {
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = 'block';
    }
  }

  /**
   * Hide the loading indicator
   */
  hideLoadingIndicator(): void {
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = 'none';
    }
  }

  /**
   * Disable all export buttons
   */
  disableButtons(): void {
    if (this.pdfButton) {
      this.pdfButton.disabled = true;
      this.pdfButton.style.opacity = '0.5';
      this.pdfButton.style.cursor = 'not-allowed';
      this.pdfButton.setAttribute('aria-disabled', 'true');
    }
    if (this.markdownButton) {
      this.markdownButton.disabled = true;
      this.markdownButton.style.opacity = '0.5';
      this.markdownButton.style.cursor = 'not-allowed';
      this.markdownButton.setAttribute('aria-disabled', 'true');
    }
  }

  /**
   * Enable all export buttons
   */
  enableButtons(): void {
    if (this.pdfButton) {
      this.pdfButton.disabled = false;
      this.pdfButton.style.opacity = '1';
      this.pdfButton.style.cursor = 'pointer';
      this.pdfButton.setAttribute('aria-disabled', 'false');
    }
    if (this.markdownButton) {
      this.markdownButton.disabled = false;
      this.markdownButton.style.opacity = '1';
      this.markdownButton.style.cursor = 'pointer';
      this.markdownButton.setAttribute('aria-disabled', 'false');
    }
  }

  /**
   * Show an error message
   * @param message - Error message to display
   */
  showError(message: string): void {
    if (this.errorDisplay) {
      this.errorDisplay.textContent = message;
      this.errorDisplay.style.display = 'block';
      
      setTimeout(() => {
        this.hideError();
      }, 10000);
    }
  }

  /**
   * Hide the error message
   */
  hideError(): void {
    if (this.errorDisplay) {
      this.errorDisplay.style.display = 'none';
      this.errorDisplay.textContent = '';
    }
  }
}
