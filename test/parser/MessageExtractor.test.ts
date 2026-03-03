import { MessageExtractor } from '../../src/parser/MessageExtractor';
import { CodeBlockExtractor } from '../../src/parser/CodeBlockExtractor';
import { TableExtractor } from '../../src/parser/TableExtractor';
import { ImageExtractor } from '../../src/parser/ImageExtractor';
import { DOMSelectors } from '../../src/types';

describe('MessageExtractor', () => {
  let extractor: MessageExtractor;
  let selectors: DOMSelectors;

  beforeEach(() => {
    selectors = {
      conversationContainer: '.conversation',
      messageContainer: '.message',
      userMessage: '.user-message',
      assistantMessage: '.assistant-message',
      codeBlock: 'pre',
      codeLanguage: '.language-label',
      table: 'table',
      image: 'img'
    };
    extractor = new MessageExtractor(selectors);
  });

  describe('extractMessages', () => {
    it('should extract messages from container', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="message user-message">
          <p>Hello</p>
        </div>
        <div class="message assistant-message">
          <p>Hi there!</p>
        </div>
      `;

      const messages = extractor.extractMessages(container);

      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('user');
      expect(messages[1].role).toBe('assistant');
    });

    it('should preserve chronological order', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="message user-message">
          <p>First message</p>
        </div>
        <div class="message assistant-message">
          <p>Second message</p>
        </div>
        <div class="message user-message">
          <p>Third message</p>
        </div>
      `;

      const messages = extractor.extractMessages(container);

      expect(messages).toHaveLength(3);
      expect(messages[0].role).toBe('user');
      expect(messages[1].role).toBe('assistant');
      expect(messages[2].role).toBe('user');
    });

    it('should extract text content from messages', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="message user-message">
          <p>What is TypeScript?</p>
        </div>
      `;

      const messages = extractor.extractMessages(container);

      expect(messages).toHaveLength(1);
      expect(messages[0].content).toHaveLength(1);
      expect(messages[0].content[0].type).toBe('text');
      expect(messages[0].content[0]).toHaveProperty('content');
    });

    it('should return empty array when no messages found', () => {
      const container = document.createElement('div');
      container.innerHTML = '<p>No messages</p>';

      const messages = extractor.extractMessages(container);

      expect(messages).toHaveLength(0);
    });
  });

  describe('identifyRole', () => {
    it('should identify user message by selector', () => {
      const messageElement = document.createElement('div');
      messageElement.className = 'message user-message';

      const role = extractor.identifyRole(messageElement);

      expect(role).toBe('user');
    });

    it('should identify assistant message by selector', () => {
      const messageElement = document.createElement('div');
      messageElement.className = 'message assistant-message';

      const role = extractor.identifyRole(messageElement);

      expect(role).toBe('assistant');
    });

    it('should identify user by class name fallback', () => {
      const messageElement = document.createElement('div');
      messageElement.className = 'message user';

      const role = extractor.identifyRole(messageElement);

      expect(role).toBe('user');
    });

    it('should identify assistant by class name fallback', () => {
      const messageElement = document.createElement('div');
      messageElement.className = 'message claude';

      const role = extractor.identifyRole(messageElement);

      expect(role).toBe('assistant');
    });

    it('should identify role by data-role attribute', () => {
      const messageElement = document.createElement('div');
      messageElement.setAttribute('data-role', 'user');

      const role = extractor.identifyRole(messageElement);

      expect(role).toBe('user');
    });

    it('should default to assistant when role cannot be determined', () => {
      const messageElement = document.createElement('div');
      messageElement.className = 'message unknown';

      const role = extractor.identifyRole(messageElement);

      expect(role).toBe('assistant');
    });
  });

  describe('extractMessages with mixed content', () => {
    it('should extract message with code block', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="message assistant-message">
          <p>Here is some code:</p>
          <pre><code>console.log('test');</code></pre>
        </div>
      `;

      const messages = extractor.extractMessages(container);

      expect(messages).toHaveLength(1);
      expect(messages[0].content.length).toBeGreaterThan(0);
      
      const hasCodeBlock = messages[0].content.some(el => el.type === 'code');
      expect(hasCodeBlock).toBe(true);
    });

    it('should extract message with table', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="message assistant-message">
          <p>Here is a table:</p>
          <table>
            <tr><th>Name</th><th>Age</th></tr>
            <tr><td>Alice</td><td>30</td></tr>
          </table>
        </div>
      `;

      const messages = extractor.extractMessages(container);

      expect(messages).toHaveLength(1);
      expect(messages[0].content.length).toBeGreaterThan(0);
      
      const hasTable = messages[0].content.some(el => el.type === 'table');
      expect(hasTable).toBe(true);
    });

    it('should extract message with image', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="message user-message">
          <p>Check this out:</p>
          <img src="https://example.com/image.png" alt="Test" />
        </div>
      `;

      const messages = extractor.extractMessages(container);

      expect(messages).toHaveLength(1);
      expect(messages[0].content.length).toBeGreaterThan(0);
      
      const hasImage = messages[0].content.some(el => el.type === 'image');
      expect(hasImage).toBe(true);
    });

    it('should extract message with multiple content types', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="message assistant-message">
          <p>Text content</p>
          <pre><code>const x = 1;</code></pre>
          <table>
            <tr><th>Col</th></tr>
            <tr><td>Val</td></tr>
          </table>
          <img src="https://example.com/img.png" />
        </div>
      `;

      const messages = extractor.extractMessages(container);

      expect(messages).toHaveLength(1);
      expect(messages[0].content.length).toBeGreaterThan(0);
      
      const contentTypes = messages[0].content.map(el => el.type);
      expect(contentTypes).toContain('text');
      expect(contentTypes).toContain('code');
      expect(contentTypes).toContain('table');
      expect(contentTypes).toContain('image');
    });
  });
});
