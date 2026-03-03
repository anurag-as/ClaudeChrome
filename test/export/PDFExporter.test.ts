import { PDFExporter } from '../../src/export/PDFExporter';
import { ChatConversation, ChatMessage, TextElement, CodeBlockElement, TableElement, ImageElement } from '../../src/types';

describe('PDFExporter', () => {
  let exporter: PDFExporter;

  beforeEach(() => {
    exporter = new PDFExporter();
  });

  describe('generate', () => {
    it('should generate a PDF blob with text-only content', async () => {
      const conversation: ChatConversation = {
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', content: 'Hello, how are you?' } as TextElement
            ]
          },
          {
            role: 'assistant',
            content: [
              { type: 'text', content: 'I am doing well, thank you!' } as TextElement
            ]
          }
        ],
        title: 'Test Conversation',
        timestamp: new Date('2024-01-01T12:00:00Z')
      };

      const blob = await exporter.generate(conversation);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/pdf');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should generate a PDF with conversation title and timestamp', async () => {
      const conversation: ChatConversation = {
        messages: [],
        title: 'My Chat',
        timestamp: new Date('2024-01-01T12:00:00Z')
      };

      const blob = await exporter.generate(conversation);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should generate a PDF without title', async () => {
      const conversation: ChatConversation = {
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', content: 'Test message' } as TextElement
            ]
          }
        ],
        timestamp: new Date('2024-01-01T12:00:00Z')
      };

      const blob = await exporter.generate(conversation);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });
  });

  describe('code block rendering', () => {
    it('should render code blocks with syntax highlighting', async () => {
      const conversation: ChatConversation = {
        messages: [
          {
            role: 'assistant',
            content: [
              {
                type: 'code',
                language: 'javascript',
                code: 'function hello() {\n  console.log("Hello, world!");\n}'
              } as CodeBlockElement
            ]
          }
        ],
        timestamp: new Date('2024-01-01T12:00:00Z')
      };

      const blob = await exporter.generate(conversation);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should render code blocks without language identifier', async () => {
      const conversation: ChatConversation = {
        messages: [
          {
            role: 'assistant',
            content: [
              {
                type: 'code',
                language: '',
                code: 'some code without language'
              } as CodeBlockElement
            ]
          }
        ],
        timestamp: new Date('2024-01-01T12:00:00Z')
      };

      const blob = await exporter.generate(conversation);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should handle multi-line code blocks', async () => {
      const conversation: ChatConversation = {
        messages: [
          {
            role: 'assistant',
            content: [
              {
                type: 'code',
                language: 'python',
                code: 'def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)'
              } as CodeBlockElement
            ]
          }
        ],
        timestamp: new Date('2024-01-01T12:00:00Z')
      };

      const blob = await exporter.generate(conversation);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });
  });

  describe('table rendering', () => {
    it('should render tables with headers and rows', async () => {
      const conversation: ChatConversation = {
        messages: [
          {
            role: 'assistant',
            content: [
              {
                type: 'table',
                headers: ['Name', 'Age', 'City'],
                rows: [
                  ['Alice', '30', 'New York'],
                  ['Bob', '25', 'San Francisco'],
                  ['Charlie', '35', 'Chicago']
                ]
              } as TableElement
            ]
          }
        ],
        timestamp: new Date('2024-01-01T12:00:00Z')
      };

      const blob = await exporter.generate(conversation);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should render empty tables', async () => {
      const conversation: ChatConversation = {
        messages: [
          {
            role: 'assistant',
            content: [
              {
                type: 'table',
                headers: ['Column 1', 'Column 2'],
                rows: []
              } as TableElement
            ]
          }
        ],
        timestamp: new Date('2024-01-01T12:00:00Z')
      };

      const blob = await exporter.generate(conversation);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should render tables with many columns', async () => {
      const conversation: ChatConversation = {
        messages: [
          {
            role: 'assistant',
            content: [
              {
                type: 'table',
                headers: ['Col1', 'Col2', 'Col3', 'Col4', 'Col5'],
                rows: [
                  ['A', 'B', 'C', 'D', 'E'],
                  ['F', 'G', 'H', 'I', 'J']
                ]
              } as TableElement
            ]
          }
        ],
        timestamp: new Date('2024-01-01T12:00:00Z')
      };

      const blob = await exporter.generate(conversation);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });
  });

  describe('image rendering', () => {
    it('should handle image with data URI', async () => {
      const conversation: ChatConversation = {
        messages: [
          {
            role: 'assistant',
            content: [
              {
                type: 'image',
                src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                alt: 'Test image'
              } as ImageElement
            ]
          }
        ],
        timestamp: new Date('2024-01-01T12:00:00Z')
      };

      const blob = await exporter.generate(conversation);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should handle image without alt text', async () => {
      const conversation: ChatConversation = {
        messages: [
          {
            role: 'assistant',
            content: [
              {
                type: 'image',
                src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
              } as ImageElement
            ]
          }
        ],
        timestamp: new Date('2024-01-01T12:00:00Z')
      };

      const blob = await exporter.generate(conversation);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should handle image loading errors gracefully', async () => {
      const conversation: ChatConversation = {
        messages: [
          {
            role: 'assistant',
            content: [
              {
                type: 'image',
                src: 'https://invalid-url-that-does-not-exist.com/image.jpg',
                alt: 'Failed image'
              } as ImageElement
            ]
          }
        ],
        timestamp: new Date('2024-01-01T12:00:00Z')
      };

      // Should not throw, but handle error gracefully
      const blob = await exporter.generate(conversation);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });
  });

  describe('mixed content', () => {
    it('should render messages with mixed content types', async () => {
      const conversation: ChatConversation = {
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', content: 'Can you show me a code example?' } as TextElement
            ]
          },
          {
            role: 'assistant',
            content: [
              { type: 'text', content: 'Sure! Here is an example:' } as TextElement,
              {
                type: 'code',
                language: 'javascript',
                code: 'console.log("Hello");'
              } as CodeBlockElement,
              { type: 'text', content: 'And here is a table:' } as TextElement,
              {
                type: 'table',
                headers: ['Key', 'Value'],
                rows: [['foo', 'bar']]
              } as TableElement
            ]
          }
        ],
        title: 'Mixed Content Test',
        timestamp: new Date('2024-01-01T12:00:00Z')
      };

      const blob = await exporter.generate(conversation);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should handle long conversations with pagination', async () => {
      const messages: ChatMessage[] = [];
      
      // Create a long conversation
      for (let i = 0; i < 20; i++) {
        messages.push({
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: [
            { type: 'text', content: `This is message number ${i + 1}. `.repeat(10) } as TextElement
          ]
        });
      }

      const conversation: ChatConversation = {
        messages,
        title: 'Long Conversation',
        timestamp: new Date('2024-01-01T12:00:00Z')
      };

      const blob = await exporter.generate(conversation);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });
  });

  describe('custom options', () => {
    it('should respect custom font size', async () => {
      const customExporter = new PDFExporter({
        fontSize: 14
      });

      const conversation: ChatConversation = {
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', content: 'Test with custom font size' } as TextElement
            ]
          }
        ],
        timestamp: new Date('2024-01-01T12:00:00Z')
      };

      const blob = await customExporter.generate(conversation);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should respect custom margins', async () => {
      const customExporter = new PDFExporter({
        margins: { top: 30, right: 30, bottom: 30, left: 30 }
      });

      const conversation: ChatConversation = {
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', content: 'Test with custom margins' } as TextElement
            ]
          }
        ],
        timestamp: new Date('2024-01-01T12:00:00Z')
      };

      const blob = await customExporter.generate(conversation);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });
  });
});
