import { MarkdownExporter } from '../../src/export/MarkdownExporter';
import { ChatConversation, ChatMessage, TextElement, CodeBlockElement, TableElement, ImageElement } from '../../src/types';

describe('MarkdownExporter', () => {
  let exporter: MarkdownExporter;

  beforeEach(() => {
    exporter = new MarkdownExporter();
  });

  describe('generate', () => {
    it('should generate markdown with conversation header', () => {
      const conversation: ChatConversation = {
        title: 'Test Conversation',
        timestamp: new Date('2024-01-15T10:30:00'),
        messages: []
      };

      const result = exporter.generate(conversation);

      expect(result).toContain('# Test Conversation');
      expect(result).toContain('*Exported:');
    });

    it('should generate markdown without title if not provided', () => {
      const conversation: ChatConversation = {
        timestamp: new Date('2024-01-15T10:30:00'),
        messages: []
      };

      const result = exporter.generate(conversation);

      expect(result).not.toContain('#');
      expect(result).toContain('*Exported:');
    });

    it('should generate markdown with user and assistant messages', () => {
      const conversation: ChatConversation = {
        timestamp: new Date('2024-01-15T10:30:00'),
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', content: 'Hello' }]
          },
          {
            role: 'assistant',
            content: [{ type: 'text', content: 'Hi there' }]
          }
        ]
      };

      const result = exporter.generate(conversation);

      expect(result).toContain('**User**:');
      expect(result).toContain('**Assistant**:');
      expect(result).toContain('Hello');
      expect(result).toContain('Hi there');
    });
  });

  describe('text formatting and escaping', () => {
    it('should preserve markdown formatting in text', () => {
      const conversation: ChatConversation = {
        timestamp: new Date('2024-01-15T10:30:00'),
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', content: '**bold** *italic* [link](url) `code`' }]
          }
        ]
      };

      const result = exporter.generate(conversation);

      // Text content is already in markdown format, should not be escaped
      expect(result).toContain('**bold**');
      expect(result).toContain('*italic*');
      expect(result).toContain('[link](url)');
      expect(result).toContain('`code`');
    });

    it('should preserve backslashes in text', () => {
      const conversation: ChatConversation = {
        timestamp: new Date('2024-01-15T10:30:00'),
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', content: 'C:\\Users\\test' }]
          }
        ]
      };

      const result = exporter.generate(conversation);

      // Text content is already formatted, backslashes preserved as-is
      expect(result).toContain('C:\\Users\\test');
    });

    it('should preserve hash symbols in text', () => {
      const conversation: ChatConversation = {
        timestamp: new Date('2024-01-15T10:30:00'),
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', content: '# Not a header' }]
          }
        ]
      };

      const result = exporter.generate(conversation);

      // Text content is already formatted, hash preserved as-is
      expect(result).toContain('# Not a header');
    });

    it('should handle plain text without special characters', () => {
      const conversation: ChatConversation = {
        timestamp: new Date('2024-01-15T10:30:00'),
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', content: 'Simple text message' }]
          }
        ]
      };

      const result = exporter.generate(conversation);

      expect(result).toContain('Simple text message');
    });
  });

  describe('code block generation', () => {
    it('should generate fenced code block with language identifier', () => {
      const codeBlock: CodeBlockElement = {
        type: 'code',
        language: 'typescript',
        code: 'const x = 5;'
      };

      const conversation: ChatConversation = {
        timestamp: new Date('2024-01-15T10:30:00'),
        messages: [
          {
            role: 'assistant',
            content: [codeBlock]
          }
        ]
      };

      const result = exporter.generate(conversation);

      expect(result).toContain('```typescript');
      expect(result).toContain('const x = 5;');
      expect(result).toContain('```');
    });

    it('should generate code block without language if not specified', () => {
      const codeBlock: CodeBlockElement = {
        type: 'code',
        language: '',
        code: 'plain code'
      };

      const conversation: ChatConversation = {
        timestamp: new Date('2024-01-15T10:30:00'),
        messages: [
          {
            role: 'assistant',
            content: [codeBlock]
          }
        ]
      };

      const result = exporter.generate(conversation);

      expect(result).toContain('```\n');
      expect(result).toContain('plain code');
    });

    it('should preserve code formatting and indentation', () => {
      const codeBlock: CodeBlockElement = {
        type: 'code',
        language: 'python',
        code: 'def hello():\n    print("Hello")\n    return True'
      };

      const conversation: ChatConversation = {
        timestamp: new Date('2024-01-15T10:30:00'),
        messages: [
          {
            role: 'assistant',
            content: [codeBlock]
          }
        ]
      };

      const result = exporter.generate(conversation);

      expect(result).toContain('```python');
      expect(result).toContain('def hello():');
      expect(result).toContain('    print("Hello")');
      expect(result).toContain('    return True');
    });

    it('should handle multiple code blocks in a message', () => {
      const conversation: ChatConversation = {
        timestamp: new Date('2024-01-15T10:30:00'),
        messages: [
          {
            role: 'assistant',
            content: [
              { type: 'text', content: 'Here is some JavaScript:' },
              { type: 'code', language: 'javascript', code: 'console.log("JS");' },
              { type: 'text', content: 'And some Python:' },
              { type: 'code', language: 'python', code: 'print("Python")' }
            ]
          }
        ]
      };

      const result = exporter.generate(conversation);

      expect(result).toContain('```javascript');
      expect(result).toContain('console.log("JS");');
      expect(result).toContain('```python');
      expect(result).toContain('print("Python")');
    });
  });

  describe('table generation', () => {
    it('should generate markdown table with headers and rows', () => {
      const table: TableElement = {
        type: 'table',
        headers: ['Name', 'Age', 'City'],
        rows: [
          ['Alice', '30', 'NYC'],
          ['Bob', '25', 'LA']
        ]
      };

      const conversation: ChatConversation = {
        timestamp: new Date('2024-01-15T10:30:00'),
        messages: [
          {
            role: 'assistant',
            content: [table]
          }
        ]
      };

      const result = exporter.generate(conversation);

      expect(result).toContain('| Name | Age | City |');
      expect(result).toContain('| --- | --- | --- |');
      expect(result).toContain('| Alice | 30 | NYC |');
      expect(result).toContain('| Bob | 25 | LA |');
    });

    it('should handle empty table', () => {
      const table: TableElement = {
        type: 'table',
        headers: [],
        rows: []
      };

      const conversation: ChatConversation = {
        timestamp: new Date('2024-01-15T10:30:00'),
        messages: [
          {
            role: 'assistant',
            content: [table]
          }
        ]
      };

      const result = exporter.generate(conversation);

      expect(result).not.toContain('|');
    });

    it('should handle table with only headers', () => {
      const table: TableElement = {
        type: 'table',
        headers: ['Column1', 'Column2'],
        rows: []
      };

      const conversation: ChatConversation = {
        timestamp: new Date('2024-01-15T10:30:00'),
        messages: [
          {
            role: 'assistant',
            content: [table]
          }
        ]
      };

      const result = exporter.generate(conversation);

      expect(result).toContain('| Column1 | Column2 |');
      expect(result).toContain('| --- | --- |');
    });

    it('should escape markdown characters in table cells', () => {
      const table: TableElement = {
        type: 'table',
        headers: ['Code', 'Description'],
        rows: [
          ['`const x = 5`', '*Important*']
        ]
      };

      const conversation: ChatConversation = {
        timestamp: new Date('2024-01-15T10:30:00'),
        messages: [
          {
            role: 'assistant',
            content: [table]
          }
        ]
      };

      const result = exporter.generate(conversation);

      expect(result).toContain('\\`const x = 5\\`');
      expect(result).toContain('\\*Important\\*');
    });

    it('should handle table with varying column counts', () => {
      const table: TableElement = {
        type: 'table',
        headers: ['A', 'B', 'C'],
        rows: [
          ['1', '2', '3'],
          ['4', '5', '6']
        ]
      };

      const conversation: ChatConversation = {
        timestamp: new Date('2024-01-15T10:30:00'),
        messages: [
          {
            role: 'assistant',
            content: [table]
          }
        ]
      };

      const result = exporter.generate(conversation);

      expect(result).toContain('| A | B | C |');
      expect(result).toContain('| 1 | 2 | 3 |');
      expect(result).toContain('| 4 | 5 | 6 |');
    });
  });

  describe('image reference generation', () => {
    it('should generate image reference with alt text', () => {
      const image: ImageElement = {
        type: 'image',
        src: 'https://example.com/image.png',
        alt: 'Example Image'
      };

      const conversation: ChatConversation = {
        timestamp: new Date('2024-01-15T10:30:00'),
        messages: [
          {
            role: 'assistant',
            content: [image]
          }
        ]
      };

      const result = exporter.generate(conversation);

      expect(result).toContain('![Example Image](https://example.com/image.png)');
    });

    it('should generate image reference without alt text', () => {
      const image: ImageElement = {
        type: 'image',
        src: 'https://example.com/image.png'
      };

      const conversation: ChatConversation = {
        timestamp: new Date('2024-01-15T10:30:00'),
        messages: [
          {
            role: 'assistant',
            content: [image]
          }
        ]
      };

      const result = exporter.generate(conversation);

      expect(result).toContain('![](https://example.com/image.png)');
    });

    it('should handle data URI images', () => {
      const image: ImageElement = {
        type: 'image',
        src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA',
        alt: 'Data URI Image'
      };

      const conversation: ChatConversation = {
        timestamp: new Date('2024-01-15T10:30:00'),
        messages: [
          {
            role: 'assistant',
            content: [image]
          }
        ]
      };

      const result = exporter.generate(conversation);

      expect(result).toContain('![Data URI Image](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA)');
    });

    it('should escape markdown characters in alt text', () => {
      const image: ImageElement = {
        type: 'image',
        src: 'https://example.com/image.png',
        alt: 'Image with *special* characters'
      };

      const conversation: ChatConversation = {
        timestamp: new Date('2024-01-15T10:30:00'),
        messages: [
          {
            role: 'assistant',
            content: [image]
          }
        ]
      };

      const result = exporter.generate(conversation);

      expect(result).toContain('![Image with \\*special\\* characters]');
    });

    it('should handle multiple images in a message', () => {
      const conversation: ChatConversation = {
        timestamp: new Date('2024-01-15T10:30:00'),
        messages: [
          {
            role: 'assistant',
            content: [
              { type: 'image', src: 'https://example.com/img1.png', alt: 'First' },
              { type: 'image', src: 'https://example.com/img2.png', alt: 'Second' }
            ]
          }
        ]
      };

      const result = exporter.generate(conversation);

      expect(result).toContain('![First](https://example.com/img1.png)');
      expect(result).toContain('![Second](https://example.com/img2.png)');
    });
  });

  describe('mixed content', () => {
    it('should handle message with mixed content types', () => {
      const conversation: ChatConversation = {
        title: 'Mixed Content Test',
        timestamp: new Date('2024-01-15T10:30:00'),
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
              { type: 'code', language: 'javascript', code: 'function test() {\n  return true;\n}' },
              { type: 'text', content: 'And here is a table:' },
              { 
                type: 'table', 
                headers: ['Feature', 'Status'], 
                rows: [['Auth', 'Done'], ['API', 'In Progress']]
              },
              { type: 'image', src: 'https://example.com/diagram.png', alt: 'Architecture Diagram' }
            ]
          }
        ]
      };

      const result = exporter.generate(conversation);

      // Check all content types are present
      expect(result).toContain('# Mixed Content Test');
      expect(result).toContain('**User**:');
      expect(result).toContain('Can you show me a code example?');
      expect(result).toContain('**Assistant**:');
      expect(result).toContain('Sure! Here is an example:');
      expect(result).toContain('```javascript');
      expect(result).toContain('function test()');
      expect(result).toContain('And here is a table:');
      expect(result).toContain('| Feature | Status |');
      expect(result).toContain('| Auth | Done |');
      expect(result).toContain('![Architecture Diagram](https://example.com/diagram.png)');
    });
  });
});
