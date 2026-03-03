import { UIManager } from '../../src/ui/UIManager';

describe('UIManager', () => {
  let uiManager: UIManager;
  let mockPdfExport: jest.Mock;
  let mockMarkdownExport: jest.Mock;

  beforeEach(() => {
    // Clear document body
    document.body.innerHTML = '';
    
    // Create new UIManager instance
    uiManager = new UIManager();
    
    // Create mock export functions
    mockPdfExport = jest.fn().mockResolvedValue(undefined);
    mockMarkdownExport = jest.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    // Clean up DOM
    document.body.innerHTML = '';
    document.head.querySelectorAll('#claude-exporter-spinner-animation').forEach(el => el.remove());
  });

  describe('initialize', () => {
    it('should create and inject UI container into the page', () => {
      uiManager.initialize(mockPdfExport, mockMarkdownExport);

      const container = document.getElementById('claude-chat-exporter-ui');
      expect(container).not.toBeNull();
      expect(container?.parentElement).toBe(document.body);
    });

    it('should create PDF export button', () => {
      uiManager.initialize(mockPdfExport, mockMarkdownExport);

      const pdfButton = document.querySelector('.claude-exporter-btn-pdf') as HTMLButtonElement;
      expect(pdfButton).not.toBeNull();
      expect(pdfButton?.textContent).toBe('Export as PDF');
    });

    it('should create Markdown export button', () => {
      uiManager.initialize(mockPdfExport, mockMarkdownExport);

      const markdownButton = document.querySelector('.claude-exporter-btn-markdown') as HTMLButtonElement;
      expect(markdownButton).not.toBeNull();
      expect(markdownButton?.textContent).toBe('Export as Markdown');
    });

    it('should position container in top-right corner', () => {
      uiManager.initialize(mockPdfExport, mockMarkdownExport);

      const container = document.getElementById('claude-chat-exporter-ui');
      expect(container?.style.position).toBe('fixed');
      expect(container?.style.top).toBe('20px');
      expect(container?.style.right).toBe('20px');
    });

    it('should create loading indicator (hidden by default)', () => {
      uiManager.initialize(mockPdfExport, mockMarkdownExport);

      const loadingIndicator = document.querySelector('.claude-exporter-loading') as HTMLDivElement;
      expect(loadingIndicator).not.toBeNull();
      expect(loadingIndicator?.style.display).toBe('none');
    });

    it('should create error display (hidden by default)', () => {
      uiManager.initialize(mockPdfExport, mockMarkdownExport);

      const errorDisplay = document.querySelector('.claude-exporter-error') as HTMLDivElement;
      expect(errorDisplay).not.toBeNull();
      expect(errorDisplay?.style.display).toBe('none');
    });

    it('should add spinner animation styles to document head', () => {
      uiManager.initialize(mockPdfExport, mockMarkdownExport);

      const spinnerStyle = document.getElementById('claude-exporter-spinner-animation');
      expect(spinnerStyle).not.toBeNull();
      expect(spinnerStyle?.textContent).toContain('@keyframes spin');
    });
  });

  describe('button interactions', () => {
    beforeEach(() => {
      uiManager.initialize(mockPdfExport, mockMarkdownExport);
    });

    it('should call PDF export callback when PDF button is clicked', async () => {
      const pdfButton = document.querySelector('.claude-exporter-btn-pdf') as HTMLButtonElement;
      
      pdfButton.click();
      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for async

      expect(mockPdfExport).toHaveBeenCalledTimes(1);
      expect(mockMarkdownExport).not.toHaveBeenCalled();
    });

    it('should call Markdown export callback when Markdown button is clicked', async () => {
      const markdownButton = document.querySelector('.claude-exporter-btn-markdown') as HTMLButtonElement;
      
      markdownButton.click();
      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for async

      expect(mockMarkdownExport).toHaveBeenCalledTimes(1);
      expect(mockPdfExport).not.toHaveBeenCalled();
    });

    it('should apply hover styles when mouse enters button', () => {
      const pdfButton = document.querySelector('.claude-exporter-btn-pdf') as HTMLButtonElement;
      const originalBgColor = pdfButton.style.backgroundColor;

      const mouseEnterEvent = new MouseEvent('mouseenter');
      pdfButton.dispatchEvent(mouseEnterEvent);

      expect(pdfButton.style.backgroundColor).toBe('rgb(29, 78, 216)'); // #1d4ed8
      expect(pdfButton.style.transform).toBe('translateY(-1px)');
    });

    it('should remove hover styles when mouse leaves button', () => {
      const pdfButton = document.querySelector('.claude-exporter-btn-pdf') as HTMLButtonElement;

      // First hover
      pdfButton.dispatchEvent(new MouseEvent('mouseenter'));
      // Then leave
      pdfButton.dispatchEvent(new MouseEvent('mouseleave'));

      expect(pdfButton.style.backgroundColor).toBe('rgb(37, 99, 235)'); // #2563eb
      expect(pdfButton.style.transform).toBe('translateY(0)');
    });

    it('should apply pressed effect on mousedown', () => {
      const pdfButton = document.querySelector('.claude-exporter-btn-pdf') as HTMLButtonElement;

      pdfButton.dispatchEvent(new MouseEvent('mousedown'));

      expect(pdfButton.style.transform).toBe('translateY(0)');
    });

    it('should not apply hover styles when button is disabled', () => {
      const pdfButton = document.querySelector('.claude-exporter-btn-pdf') as HTMLButtonElement;
      
      uiManager.disableButtons();
      const disabledBgColor = pdfButton.style.backgroundColor;

      pdfButton.dispatchEvent(new MouseEvent('mouseenter'));

      expect(pdfButton.style.backgroundColor).toBe(disabledBgColor);
    });
  });

  describe('loading indicator', () => {
    beforeEach(() => {
      uiManager.initialize(mockPdfExport, mockMarkdownExport);
    });

    it('should show loading indicator when showLoadingIndicator is called', () => {
      uiManager.showLoadingIndicator();

      const loadingIndicator = document.querySelector('.claude-exporter-loading') as HTMLDivElement;
      expect(loadingIndicator.style.display).toBe('block');
    });

    it('should hide loading indicator when hideLoadingIndicator is called', () => {
      uiManager.showLoadingIndicator();
      uiManager.hideLoadingIndicator();

      const loadingIndicator = document.querySelector('.claude-exporter-loading') as HTMLDivElement;
      expect(loadingIndicator.style.display).toBe('none');
    });

    it('should contain spinner element', () => {
      uiManager.showLoadingIndicator();

      const spinner = document.querySelector('.spinner');
      expect(spinner).not.toBeNull();
    });

    it('should display "Exporting..." text', () => {
      uiManager.showLoadingIndicator();

      const loadingIndicator = document.querySelector('.claude-exporter-loading') as HTMLDivElement;
      expect(loadingIndicator.textContent).toContain('Exporting...');
    });
  });

  describe('button state management', () => {
    beforeEach(() => {
      uiManager.initialize(mockPdfExport, mockMarkdownExport);
    });

    it('should disable both buttons when disableButtons is called', () => {
      uiManager.disableButtons();

      const pdfButton = document.querySelector('.claude-exporter-btn-pdf') as HTMLButtonElement;
      const markdownButton = document.querySelector('.claude-exporter-btn-markdown') as HTMLButtonElement;

      expect(pdfButton.disabled).toBe(true);
      expect(markdownButton.disabled).toBe(true);
    });

    it('should set opacity to 0.5 when buttons are disabled', () => {
      uiManager.disableButtons();

      const pdfButton = document.querySelector('.claude-exporter-btn-pdf') as HTMLButtonElement;
      const markdownButton = document.querySelector('.claude-exporter-btn-markdown') as HTMLButtonElement;

      expect(pdfButton.style.opacity).toBe('0.5');
      expect(markdownButton.style.opacity).toBe('0.5');
    });

    it('should set cursor to not-allowed when buttons are disabled', () => {
      uiManager.disableButtons();

      const pdfButton = document.querySelector('.claude-exporter-btn-pdf') as HTMLButtonElement;
      const markdownButton = document.querySelector('.claude-exporter-btn-markdown') as HTMLButtonElement;

      expect(pdfButton.style.cursor).toBe('not-allowed');
      expect(markdownButton.style.cursor).toBe('not-allowed');
    });

    it('should enable both buttons when enableButtons is called', () => {
      uiManager.disableButtons();
      uiManager.enableButtons();

      const pdfButton = document.querySelector('.claude-exporter-btn-pdf') as HTMLButtonElement;
      const markdownButton = document.querySelector('.claude-exporter-btn-markdown') as HTMLButtonElement;

      expect(pdfButton.disabled).toBe(false);
      expect(markdownButton.disabled).toBe(false);
    });

    it('should restore opacity to 1 when buttons are enabled', () => {
      uiManager.disableButtons();
      uiManager.enableButtons();

      const pdfButton = document.querySelector('.claude-exporter-btn-pdf') as HTMLButtonElement;
      const markdownButton = document.querySelector('.claude-exporter-btn-markdown') as HTMLButtonElement;

      expect(pdfButton.style.opacity).toBe('1');
      expect(markdownButton.style.opacity).toBe('1');
    });

    it('should restore cursor to pointer when buttons are enabled', () => {
      uiManager.disableButtons();
      uiManager.enableButtons();

      const pdfButton = document.querySelector('.claude-exporter-btn-pdf') as HTMLButtonElement;
      const markdownButton = document.querySelector('.claude-exporter-btn-markdown') as HTMLButtonElement;

      expect(pdfButton.style.cursor).toBe('pointer');
      expect(markdownButton.style.cursor).toBe('pointer');
    });
  });

  describe('error display', () => {
    beforeEach(() => {
      uiManager.initialize(mockPdfExport, mockMarkdownExport);
    });

    it('should show error message when showError is called', () => {
      const errorMessage = 'Failed to export PDF';
      
      uiManager.showError(errorMessage);

      const errorDisplay = document.querySelector('.claude-exporter-error') as HTMLDivElement;
      expect(errorDisplay.style.display).toBe('block');
      expect(errorDisplay.textContent).toBe(errorMessage);
    });

    it('should hide error message when hideError is called', () => {
      uiManager.showError('Test error');
      uiManager.hideError();

      const errorDisplay = document.querySelector('.claude-exporter-error') as HTMLDivElement;
      expect(errorDisplay.style.display).toBe('none');
      expect(errorDisplay.textContent).toBe('');
    });

    it('should display multiple different error messages', () => {
      const errorDisplay = document.querySelector('.claude-exporter-error') as HTMLDivElement;

      uiManager.showError('First error');
      expect(errorDisplay.textContent).toBe('First error');

      uiManager.showError('Second error');
      expect(errorDisplay.textContent).toBe('Second error');
    });

    it('should have error styling (red background and border)', () => {
      uiManager.showError('Test error');

      const errorDisplay = document.querySelector('.claude-exporter-error') as HTMLDivElement;
      expect(errorDisplay.style.backgroundColor).toBe('rgb(254, 242, 242)'); // #fef2f2
      expect(errorDisplay.style.borderColor).toBe('#fecaca');
      expect(errorDisplay.style.color).toBe('rgb(153, 27, 27)'); // #991b1b
    });
  });

  describe('integration scenarios', () => {
    beforeEach(() => {
      uiManager.initialize(mockPdfExport, mockMarkdownExport);
    });

    it('should handle complete export flow: disable buttons, show loading, then re-enable', () => {
      const pdfButton = document.querySelector('.claude-exporter-btn-pdf') as HTMLButtonElement;
      const loadingIndicator = document.querySelector('.claude-exporter-loading') as HTMLDivElement;

      // Simulate export start
      uiManager.disableButtons();
      uiManager.showLoadingIndicator();

      expect(pdfButton.disabled).toBe(true);
      expect(loadingIndicator.style.display).toBe('block');

      // Simulate export complete
      uiManager.hideLoadingIndicator();
      uiManager.enableButtons();

      expect(pdfButton.disabled).toBe(false);
      expect(loadingIndicator.style.display).toBe('none');
    });

    it('should handle error flow: show error, re-enable buttons', () => {
      const pdfButton = document.querySelector('.claude-exporter-btn-pdf') as HTMLButtonElement;
      const errorDisplay = document.querySelector('.claude-exporter-error') as HTMLDivElement;

      // Simulate export start
      uiManager.disableButtons();
      uiManager.showLoadingIndicator();

      // Simulate error
      uiManager.hideLoadingIndicator();
      uiManager.showError('Export failed');
      uiManager.enableButtons();

      expect(pdfButton.disabled).toBe(false);
      expect(errorDisplay.style.display).toBe('block');
      expect(errorDisplay.textContent).toBe('Export failed');
    });

    it('should clear previous error when showing new error', () => {
      const errorDisplay = document.querySelector('.claude-exporter-error') as HTMLDivElement;

      uiManager.showError('First error');
      expect(errorDisplay.textContent).toBe('First error');

      uiManager.hideError();
      expect(errorDisplay.textContent).toBe('');

      uiManager.showError('Second error');
      expect(errorDisplay.textContent).toBe('Second error');
    });
  });
});
