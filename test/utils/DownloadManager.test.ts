import { DownloadManager } from '../../src/utils/DownloadManager';

describe('DownloadManager', () => {
  let downloadManager: DownloadManager;
  let mockAnchor: HTMLAnchorElement;
  let createElementSpy: jest.SpyInstance;
  let createObjectURLSpy: jest.SpyInstance;
  let revokeObjectURLSpy: jest.SpyInstance;

  beforeEach(() => {
    downloadManager = new DownloadManager();

    // Mock anchor element
    mockAnchor = {
      href: '',
      download: '',
      style: { display: '' },
      click: jest.fn(),
    } as unknown as HTMLAnchorElement;

    // Mock document.createElement
    createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor);

    // Mock document.body methods
    jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor);
    jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor);

    // Mock URL methods - need to mock on global object
    createObjectURLSpy = jest.fn().mockReturnValue('blob:mock-url');
    revokeObjectURLSpy = jest.fn();
    (global.URL.createObjectURL as any) = createObjectURLSpy;
    (global.URL.revokeObjectURL as any) = revokeObjectURLSpy;

    // Mock setTimeout to execute immediately
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe('downloadFile', () => {
    it('should download a Blob with correct filename and mime type', () => {
      const blob = new Blob(['test content'], { type: 'text/plain' });
      const filename = 'test.txt';
      const mimeType = 'text/plain';

      downloadManager.downloadFile(blob, filename, mimeType);

      expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockAnchor.href).toBe('blob:mock-url');
      expect(mockAnchor.download).toBe(filename);
      expect(mockAnchor.style.display).toBe('none');
      expect(document.body.appendChild).toHaveBeenCalledWith(mockAnchor);
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalledWith(mockAnchor);
    });

    it('should download a string by converting it to Blob', () => {
      const content = 'test string content';
      const filename = 'test.txt';
      const mimeType = 'text/plain';

      downloadManager.downloadFile(content, filename, mimeType);

      expect(createObjectURLSpy).toHaveBeenCalled();
      const blobArg = createObjectURLSpy.mock.calls[0][0];
      expect(blobArg).toBeInstanceOf(Blob);
      expect(blobArg.type).toBe(mimeType);
      expect(mockAnchor.download).toBe(filename);
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('should download PDF blob with correct mime type', () => {
      const pdfBlob = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
      const filename = 'export.pdf';
      const mimeType = 'application/pdf';

      downloadManager.downloadFile(pdfBlob, filename, mimeType);

      expect(createObjectURLSpy).toHaveBeenCalledWith(pdfBlob);
      expect(mockAnchor.download).toBe(filename);
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('should download Markdown string with correct mime type', () => {
      const markdown = '# Test\n\nContent';
      const filename = 'export.md';
      const mimeType = 'text/markdown';

      downloadManager.downloadFile(markdown, filename, mimeType);

      const blobArg = createObjectURLSpy.mock.calls[0][0];
      expect(blobArg.type).toBe(mimeType);
      expect(mockAnchor.download).toBe(filename);
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('should revoke object URL after timeout', () => {
      const blob = new Blob(['test'], { type: 'text/plain' });

      downloadManager.downloadFile(blob, 'test.txt', 'text/plain');

      expect(revokeObjectURLSpy).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should throw error if download fails', () => {
      createElementSpy.mockImplementation(() => {
        throw new Error('DOM error');
      });

      expect(() => {
        downloadManager.downloadFile('content', 'test.txt', 'text/plain');
      }).toThrow('Failed to download file: DOM error');
    });

    it('should handle unknown errors', () => {
      createElementSpy.mockImplementation(() => {
        throw 'string error';
      });

      expect(() => {
        downloadManager.downloadFile('content', 'test.txt', 'text/plain');
      }).toThrow('Failed to download file: Unknown error');
    });
  });

  describe('generateFilename', () => {
    it('should generate filename with timestamp', () => {
      const mockDate = new Date('2024-01-15T14:30:22.123Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const filename = downloadManager.generateFilename('chat-export', 'pdf');

      expect(filename).toBe('chat-export-20240115-143022.pdf');
    });

    it('should generate filename for markdown export', () => {
      const mockDate = new Date('2024-03-20T09:15:45.678Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const filename = downloadManager.generateFilename('conversation', 'md');

      expect(filename).toBe('conversation-20240320-091545.md');
    });

    it('should handle different base names', () => {
      const mockDate = new Date('2024-12-31T23:59:59.999Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const filename = downloadManager.generateFilename('my-chat', 'txt');

      expect(filename).toBe('my-chat-20241231-235959.txt');
    });

    it('should format timestamp without colons', () => {
      const mockDate = new Date('2024-06-15T12:34:56.789Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const filename = downloadManager.generateFilename('export', 'pdf');

      expect(filename).not.toContain(':');
      expect(filename).toBe('export-20240615-123456.pdf');
    });
  });
});
