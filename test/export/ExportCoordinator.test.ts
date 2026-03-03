import { ExportCoordinator } from '../../src/export/ExportCoordinator';
import { ContentParser } from '../../src/parser/ContentParser';
import { PDFExporter } from '../../src/export/PDFExporter';
import { MarkdownExporter } from '../../src/export/MarkdownExporter';
import { DownloadManager } from '../../src/utils/DownloadManager';
import { ErrorHandler } from '../../src/utils/ErrorHandler';
import { UIManager } from '../../src/ui/UIManager';
import { ChatConversation, DOMSelectors } from '../../src/types';

// Mock all dependencies
jest.mock('../../src/parser/ContentParser');
jest.mock('../../src/export/PDFExporter');
jest.mock('../../src/export/MarkdownExporter');
jest.mock('../../src/utils/DownloadManager');
jest.mock('../../src/utils/ErrorHandler');
jest.mock('../../src/ui/UIManager');

describe('ExportCoordinator', () => {
  let coordinator: ExportCoordinator;
  let mockContentParser: jest.Mocked<ContentParser>;
  let mockPDFExporter: jest.Mocked<PDFExporter>;
  let mockMarkdownExporter: jest.Mocked<MarkdownExporter>;
  let mockDownloadManager: jest.Mocked<DownloadManager>;
  let mockErrorHandler: jest.Mocked<ErrorHandler>;
  let mockUIManager: jest.Mocked<UIManager>;
  let mockSelectors: DOMSelectors;
  let mockConversation: ChatConversation;

  beforeEach(() => {
    // Setup mock selectors
    mockSelectors = {
      conversationContainer: '.conversation',
      messageContainer: '.message',
      userMessage: '.user',
      assistantMessage: '.assistant',
      codeBlock: 'pre code',
      codeLanguage: '.language',
      table: 'table',
      image: 'img'
    };

    // Setup mock conversation
    mockConversation = {
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', content: 'Hello' }]
        },
        {
          role: 'assistant',
          content: [{ type: 'text', content: 'Hi there!' }]
        }
      ],
      title: 'Test Conversation',
      timestamp: new Date('2024-01-15T10:00:00Z')
    };

    // Create mock instances
    mockUIManager = new UIManager() as jest.Mocked<UIManager>;
    mockErrorHandler = new ErrorHandler() as jest.Mocked<ErrorHandler>;
    mockDownloadManager = new DownloadManager() as jest.Mocked<DownloadManager>;

    // Setup UIManager mock methods
    mockUIManager.hideError = jest.fn();
    mockUIManager.disableButtons = jest.fn();
    mockUIManager.showLoadingIndicator = jest.fn();
    mockUIManager.hideLoadingIndicator = jest.fn();
    mockUIManager.enableButtons = jest.fn();
    mockUIManager.showError = jest.fn();

    // Setup ErrorHandler mock methods
    mockErrorHandler.handleError = jest.fn();
    mockErrorHandler.getUserMessage = jest.fn().mockReturnValue('User-friendly error message');

    // Setup DownloadManager mock methods
    mockDownloadManager.generateFilename = jest.fn((baseName: string, extension: string) => {
      return `${baseName}-20240115-100000.${extension}`;
    });
    mockDownloadManager.downloadFile = jest.fn();

    // Create coordinator instance
    coordinator = new ExportCoordinator(
      mockSelectors,
      mockUIManager,
      mockErrorHandler,
      mockDownloadManager
    );

    // Get mock instances from the coordinator
    mockContentParser = (ContentParser as jest.MockedClass<typeof ContentParser>).mock.instances[0] as jest.Mocked<ContentParser>;
    mockPDFExporter = (PDFExporter as jest.MockedClass<typeof PDFExporter>).mock.instances[0] as jest.Mocked<PDFExporter>;
    mockMarkdownExporter = (MarkdownExporter as jest.MockedClass<typeof MarkdownExporter>).mock.instances[0] as jest.Mocked<MarkdownExporter>;

    // Setup ContentParser mock
    mockContentParser.parseConversation = jest.fn().mockReturnValue(mockConversation);

    // Setup PDFExporter mock
    const mockPDFBlob = new Blob(['PDF content'], { type: 'application/pdf' });
    mockPDFExporter.generate = jest.fn().mockResolvedValue(mockPDFBlob);

    // Setup MarkdownExporter mock
    mockMarkdownExporter.generate = jest.fn().mockReturnValue('# Markdown content');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('exportToPDF', () => {
    it('should complete PDF export flow successfully', async () => {
      await coordinator.exportToPDF();

      // Verify UI lifecycle
      expect(mockUIManager.hideError).toHaveBeenCalled();
      expect(mockUIManager.disableButtons).toHaveBeenCalled();
      expect(mockUIManager.showLoadingIndicator).toHaveBeenCalled();

      // Verify parsing
      expect(mockContentParser.parseConversation).toHaveBeenCalled();

      // Verify PDF generation
      expect(mockPDFExporter.generate).toHaveBeenCalledWith(mockConversation);

      // Verify download
      expect(mockDownloadManager.generateFilename).toHaveBeenCalledWith('Test-Conversation', 'pdf');
      expect(mockDownloadManager.downloadFile).toHaveBeenCalledWith(
        expect.any(Blob),
        'Test-Conversation-20240115-100000.pdf',
        'application/pdf'
      );

      // Verify UI cleanup
      expect(mockUIManager.hideLoadingIndicator).toHaveBeenCalled();
      expect(mockUIManager.enableButtons).toHaveBeenCalled();
      expect(mockUIManager.showError).not.toHaveBeenCalled();
    });

    it('should handle parsing errors during PDF export', async () => {
      const parseError = new Error('Failed to parse conversation');
      mockContentParser.parseConversation = jest.fn().mockImplementation(() => {
        throw parseError;
      });

      await expect(coordinator.exportToPDF()).rejects.toThrow('Failed to parse conversation');

      // Verify error handling
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(parseError, 'PDF export');
      expect(mockErrorHandler.getUserMessage).toHaveBeenCalledWith(parseError);

      // Verify UI error state
      expect(mockUIManager.hideLoadingIndicator).toHaveBeenCalled();
      expect(mockUIManager.enableButtons).toHaveBeenCalled();
      expect(mockUIManager.showError).toHaveBeenCalledWith('User-friendly error message');

      // Verify download was not attempted
      expect(mockDownloadManager.downloadFile).not.toHaveBeenCalled();
    });

    it('should handle PDF generation errors', async () => {
      const pdfError = new Error('PDF generation failed');
      mockPDFExporter.generate = jest.fn().mockRejectedValue(pdfError);

      await expect(coordinator.exportToPDF()).rejects.toThrow('PDF generation failed');

      // Verify error handling
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(pdfError, 'PDF export');
      expect(mockErrorHandler.getUserMessage).toHaveBeenCalledWith(pdfError);

      // Verify UI error state
      expect(mockUIManager.showError).toHaveBeenCalledWith('User-friendly error message');
      expect(mockUIManager.hideLoadingIndicator).toHaveBeenCalled();
      expect(mockUIManager.enableButtons).toHaveBeenCalled();

      // Verify download was not attempted
      expect(mockDownloadManager.downloadFile).not.toHaveBeenCalled();
    });

    it('should handle download errors during PDF export', async () => {
      const downloadError = new Error('Download blocked');
      mockDownloadManager.downloadFile = jest.fn().mockImplementation(() => {
        throw downloadError;
      });

      await expect(coordinator.exportToPDF()).rejects.toThrow('Download blocked');

      // Verify error handling
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(downloadError, 'PDF export');
      expect(mockErrorHandler.getUserMessage).toHaveBeenCalledWith(downloadError);

      // Verify UI error state
      expect(mockUIManager.showError).toHaveBeenCalledWith('User-friendly error message');
      expect(mockUIManager.hideLoadingIndicator).toHaveBeenCalled();
      expect(mockUIManager.enableButtons).toHaveBeenCalled();
    });

    it('should handle non-Error exceptions during PDF export', async () => {
      mockContentParser.parseConversation = jest.fn().mockImplementation(() => {
        throw 'String error';
      });

      await expect(coordinator.exportToPDF()).rejects.toThrow();

      // Verify error was converted to Error and handled
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        'PDF export'
      );
      expect(mockUIManager.showError).toHaveBeenCalled();
    });
  });

  describe('exportToMarkdown', () => {
    it('should complete Markdown export flow successfully', async () => {
      await coordinator.exportToMarkdown();

      // Verify UI lifecycle
      expect(mockUIManager.hideError).toHaveBeenCalled();
      expect(mockUIManager.disableButtons).toHaveBeenCalled();
      expect(mockUIManager.showLoadingIndicator).toHaveBeenCalled();

      // Verify parsing
      expect(mockContentParser.parseConversation).toHaveBeenCalled();

      // Verify Markdown generation
      expect(mockMarkdownExporter.generate).toHaveBeenCalledWith(mockConversation);

      // Verify download
      expect(mockDownloadManager.generateFilename).toHaveBeenCalledWith('Test-Conversation', 'md');
      expect(mockDownloadManager.downloadFile).toHaveBeenCalledWith(
        '# Markdown content',
        'Test-Conversation-20240115-100000.md',
        'text/markdown'
      );

      // Verify UI cleanup
      expect(mockUIManager.hideLoadingIndicator).toHaveBeenCalled();
      expect(mockUIManager.enableButtons).toHaveBeenCalled();
      expect(mockUIManager.showError).not.toHaveBeenCalled();
    });

    it('should handle parsing errors during Markdown export', async () => {
      const parseError = new Error('Conversation container not found');
      mockContentParser.parseConversation = jest.fn().mockImplementation(() => {
        throw parseError;
      });

      await expect(coordinator.exportToMarkdown()).rejects.toThrow('Conversation container not found');

      // Verify error handling
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(parseError, 'Markdown export');
      expect(mockErrorHandler.getUserMessage).toHaveBeenCalledWith(parseError);

      // Verify UI error state
      expect(mockUIManager.hideLoadingIndicator).toHaveBeenCalled();
      expect(mockUIManager.enableButtons).toHaveBeenCalled();
      expect(mockUIManager.showError).toHaveBeenCalledWith('User-friendly error message');

      // Verify download was not attempted
      expect(mockDownloadManager.downloadFile).not.toHaveBeenCalled();
    });

    it('should handle Markdown generation errors', async () => {
      const markdownError = new Error('Markdown generation failed');
      mockMarkdownExporter.generate = jest.fn().mockImplementation(() => {
        throw markdownError;
      });

      await expect(coordinator.exportToMarkdown()).rejects.toThrow('Markdown generation failed');

      // Verify error handling
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(markdownError, 'Markdown export');
      expect(mockErrorHandler.getUserMessage).toHaveBeenCalledWith(markdownError);

      // Verify UI error state
      expect(mockUIManager.showError).toHaveBeenCalledWith('User-friendly error message');
      expect(mockUIManager.hideLoadingIndicator).toHaveBeenCalled();
      expect(mockUIManager.enableButtons).toHaveBeenCalled();

      // Verify download was not attempted
      expect(mockDownloadManager.downloadFile).not.toHaveBeenCalled();
    });

    it('should handle download errors during Markdown export', async () => {
      const downloadError = new Error('Browser blocked download');
      mockDownloadManager.downloadFile = jest.fn().mockImplementation(() => {
        throw downloadError;
      });

      await expect(coordinator.exportToMarkdown()).rejects.toThrow('Browser blocked download');

      // Verify error handling
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(downloadError, 'Markdown export');
      expect(mockErrorHandler.getUserMessage).toHaveBeenCalledWith(downloadError);

      // Verify UI error state
      expect(mockUIManager.showError).toHaveBeenCalledWith('User-friendly error message');
      expect(mockUIManager.hideLoadingIndicator).toHaveBeenCalled();
      expect(mockUIManager.enableButtons).toHaveBeenCalled();
    });

    it('should handle non-Error exceptions during Markdown export', async () => {
      mockMarkdownExporter.generate = jest.fn().mockImplementation(() => {
        throw { message: 'Object error' };
      });

      await expect(coordinator.exportToMarkdown()).rejects.toThrow();

      // Verify error was converted to Error and handled
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        'Markdown export'
      );
      expect(mockUIManager.showError).toHaveBeenCalled();
    });
  });

  describe('integration scenarios', () => {
    it('should handle conversation with multiple message types in PDF export', async () => {
      const complexConversation: ChatConversation = {
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', content: 'Can you show me a code example?' }
            ]
          },
          {
            role: 'assistant',
            content: [
              { type: 'text', content: 'Sure! Here is an example:' },
              { type: 'code', language: 'typescript', code: 'const x = 42;' },
              { type: 'table', headers: ['Name', 'Value'], rows: [['x', '42']] },
              { type: 'image', src: 'data:image/png;base64,abc', alt: 'Example' }
            ]
          }
        ],
        title: 'Complex Conversation',
        timestamp: new Date('2024-01-15T10:00:00Z')
      };

      mockContentParser.parseConversation = jest.fn().mockReturnValue(complexConversation);

      await coordinator.exportToPDF();

      expect(mockPDFExporter.generate).toHaveBeenCalledWith(complexConversation);
      expect(mockDownloadManager.downloadFile).toHaveBeenCalled();
      expect(mockUIManager.showError).not.toHaveBeenCalled();
    });

    it('should handle conversation with multiple message types in Markdown export', async () => {
      const complexConversation: ChatConversation = {
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', content: 'Show me data' }
            ]
          },
          {
            role: 'assistant',
            content: [
              { type: 'text', content: 'Here is the data:' },
              { type: 'code', language: 'python', code: 'print("hello")' },
              { type: 'table', headers: ['A', 'B'], rows: [['1', '2']] }
            ]
          }
        ],
        title: 'Data Conversation',
        timestamp: new Date('2024-01-15T10:00:00Z')
      };

      mockContentParser.parseConversation = jest.fn().mockReturnValue(complexConversation);

      await coordinator.exportToMarkdown();

      expect(mockMarkdownExporter.generate).toHaveBeenCalledWith(complexConversation);
      expect(mockDownloadManager.downloadFile).toHaveBeenCalled();
      expect(mockUIManager.showError).not.toHaveBeenCalled();
    });

    it('should clear previous errors before starting new export', async () => {
      // First export fails
      mockContentParser.parseConversation = jest.fn().mockImplementation(() => {
        throw new Error('First error');
      });

      await expect(coordinator.exportToPDF()).rejects.toThrow('First error');
      expect(mockUIManager.showError).toHaveBeenCalledWith('User-friendly error message');

      // Reset mocks
      jest.clearAllMocks();
      mockContentParser.parseConversation = jest.fn().mockReturnValue(mockConversation);
      mockPDFExporter.generate = jest.fn().mockResolvedValue(new Blob(['PDF'], { type: 'application/pdf' }));

      // Second export succeeds
      await coordinator.exportToPDF();

      // Verify error was cleared at start
      expect(mockUIManager.hideError).toHaveBeenCalled();
      expect(mockUIManager.showError).not.toHaveBeenCalled();
    });

    it('should maintain UI state consistency across multiple exports', async () => {
      // First PDF export
      await coordinator.exportToPDF();

      expect(mockUIManager.disableButtons).toHaveBeenCalledTimes(1);
      expect(mockUIManager.enableButtons).toHaveBeenCalledTimes(1);
      expect(mockUIManager.showLoadingIndicator).toHaveBeenCalledTimes(1);
      expect(mockUIManager.hideLoadingIndicator).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();

      // Second Markdown export
      await coordinator.exportToMarkdown();

      expect(mockUIManager.disableButtons).toHaveBeenCalledTimes(1);
      expect(mockUIManager.enableButtons).toHaveBeenCalledTimes(1);
      expect(mockUIManager.showLoadingIndicator).toHaveBeenCalledTimes(1);
      expect(mockUIManager.hideLoadingIndicator).toHaveBeenCalledTimes(1);
    });
  });
});
