import { CodeBlockExtractor } from '../../src/parser/CodeBlockExtractor';
import { DOMSelectors } from '../../src/types';

describe('CodeBlockExtractor', () => {
  let extractor: CodeBlockExtractor;
  let selectors: DOMSelectors;

  beforeEach(() => {
    selectors = {
      conversationContainer: '.conversation',
      messageContainer: '.message',
      userMessage: '.user-message',
      assistantMessage: '.assistant-message',
      codeBlock: 'pre',
      codeLanguage: '[class*="language-"], code[class*="language-"]',
      table: 'table',
      image: 'img'
    };
    extractor = new CodeBlockExtractor(selectors);
  });

  describe('extractCodeBlocks', () => {
    it('should extract code blocks from message element', () => {
      const messageElement = document.createElement('div');
      messageElement.innerHTML = `
        <pre><code>console.log('hello');</code></pre>
      `;

      const codeBlocks = extractor.extractCodeBlocks(messageElement);

      expect(codeBlocks).toHaveLength(1);
      expect(codeBlocks[0].type).toBe('code');
      expect(codeBlocks[0].code).toBe("console.log('hello');");
    });

    it('should extract multiple code blocks', () => {
      const messageElement = document.createElement('div');
      messageElement.innerHTML = `
        <pre><code>const x = 1;</code></pre>
        <pre><code>const y = 2;</code></pre>
      `;

      const codeBlocks = extractor.extractCodeBlocks(messageElement);

      expect(codeBlocks).toHaveLength(2);
      expect(codeBlocks[0].code).toBe('const x = 1;');
      expect(codeBlocks[1].code).toBe('const y = 2;');
    });

    it('should preserve code formatting', () => {
      const messageElement = document.createElement('div');
      messageElement.innerHTML = `
        <pre><code>function test() {
  return true;
}</code></pre>
      `;

      const codeBlocks = extractor.extractCodeBlocks(messageElement);

      expect(codeBlocks[0].code).toBe('function test() {\n  return true;\n}');
    });

    it('should return empty array when no code blocks found', () => {
      const messageElement = document.createElement('div');
      messageElement.innerHTML = '<p>No code here</p>';

      const codeBlocks = extractor.extractCodeBlocks(messageElement);

      expect(codeBlocks).toHaveLength(0);
    });
  });

  describe('detectLanguage', () => {
    it('should detect language from code element with language class', () => {
      const codeElement = document.createElement('pre');
      const code = document.createElement('code');
      code.className = 'language-javascript';
      code.textContent = "console.log('test');";
      codeElement.appendChild(code);

      const language = extractor.detectLanguage(codeElement);

      expect(language).toBe('javascript');
    });

    it('should detect language from data-language attribute', () => {
      const codeElement = document.createElement('pre');
      codeElement.setAttribute('data-language', 'python');
      codeElement.innerHTML = '<code>print("test")</code>';

      const language = extractor.detectLanguage(codeElement);

      expect(language).toBe('python');
    });

    it('should detect language from class name', () => {
      const codeElement = document.createElement('pre');
      codeElement.className = 'language-typescript';
      codeElement.innerHTML = '<code>const x: number = 1;</code>';

      const language = extractor.detectLanguage(codeElement);

      expect(language).toBe('typescript');
    });

    it('should normalize common language abbreviations', () => {
      const testCases = [
        { input: 'js', expected: 'javascript' },
        { input: 'ts', expected: 'typescript' },
        { input: 'py', expected: 'python' },
        { input: 'sh', expected: 'bash' },
        { input: 'yml', expected: 'yaml' }
      ];

      testCases.forEach(({ input, expected }) => {
        const codeElement = document.createElement('pre');
        codeElement.setAttribute('data-language', input);

        const language = extractor.detectLanguage(codeElement);

        expect(language).toBe(expected);
      });
    });

    it('should default to "text" when language cannot be detected', () => {
      const codeElement = document.createElement('pre');
      codeElement.innerHTML = '<code>some code</code>';

      const language = extractor.detectLanguage(codeElement);

      expect(language).toBe('text');
    });

    it('should handle language-prefixed class names', () => {
      const codeElement = document.createElement('pre');
      codeElement.className = 'lang-ruby';

      const language = extractor.detectLanguage(codeElement);

      expect(language).toBe('ruby');
    });
  });
});
