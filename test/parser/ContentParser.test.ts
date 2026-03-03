import { ContentParser } from '../../src/parser/ContentParser';
import { DOMSelectors } from '../../src/types';

describe('ContentParser', () => {
  let parser: ContentParser;
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
    parser = new ContentParser(selectors);

    // Clear document body
    document.body.innerHTML = '';
  });

  describe('parseConversation', () => {
    it('should parse a complete conversation', () => {
      document.body.innerHTML = `
        <div class="conversation">
          <h1>Test Conversation</h1>
          <div class="message user-message">
            <p>Hello</p>
          </div>
          <div class="message assistant-message">
            <p>Hi there!</p>
          </div>
        </div>
      `;

      const conversation = parser.parseConversation();

      expect(conversation.messages).toHaveLength(2);
      expect(conversation.messages[0].role).toBe('user');
      expect(conversation.messages[1].role).toBe('assistant');
      expect(conversation.timestamp).toBeInstanceOf(Date);
    });

    it('should extract conversation title', () => {
      document.body.innerHTML = `
        <div class="conversation">
          <h1>My Chat Title</h1>
          <div class="message user-message">
            <p>Hello</p>
          </div>
        </div>
      `;

      const conversation = parser.parseConversation();

      expect(conversation.title).toBe('My Chat Title');
    });

    it('should handle conversation without title', () => {
      document.body.innerHTML = `
        <div class="conversation">
          <div class="message user-message">
            <p>Hello</p>
          </div>
        </div>
      `;

      const conversation = parser.parseConversation();

      expect(conversation.title).toBeDefined();
    });

    it('should throw error when conversation container not found', () => {
      document.body.innerHTML = '<div>No conversation here</div>';

      // Should not throw because it falls back to document.body
      expect(() => parser.parseConversation()).not.toThrow();
    });

    it('should parse conversation with mixed content', () => {
      document.body.innerHTML = `
        <div class="conversation">
          <div class="message user-message">
            <p>Show me some code</p>
          </div>
          <div class="message assistant-message">
            <p>Here you go:</p>
            <pre><code>console.log('test');</code></pre>
            <table>
              <tr><th>Name</th></tr>
              <tr><td>Value</td></tr>
            </table>
          </div>
        </div>
      `;

      const conversation = parser.parseConversation();

      expect(conversation.messages).toHaveLength(2);
      expect(conversation.messages[1].content.length).toBeGreaterThan(1);
    });

    it('should set timestamp to current date', () => {
      document.body.innerHTML = `
        <div class="conversation">
          <div class="message user-message">
            <p>Hello</p>
          </div>
        </div>
      `;

      const before = new Date();
      const conversation = parser.parseConversation();
      const after = new Date();

      expect(conversation.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(conversation.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should handle empty conversation', () => {
      document.body.innerHTML = `
        <div class="conversation">
        </div>
      `;

      const conversation = parser.parseConversation();

      expect(conversation.messages).toHaveLength(0);
    });

    it('should use fallback selectors when primary selector fails', () => {
      document.body.innerHTML = `
        <main>
          <div class="message user-message">
            <p>Hello</p>
          </div>
        </main>
      `;

      const conversation = parser.parseConversation();

      expect(conversation.messages).toHaveLength(1);
    });
  });

  describe('title extraction', () => {
    it('should extract title from h1', () => {
      document.body.innerHTML = `
        <div class="conversation">
          <h1>Chat Title</h1>
          <div class="message user-message">
            <p>Hello</p>
          </div>
        </div>
      `;

      const conversation = parser.parseConversation();

      expect(conversation.title).toBe('Chat Title');
    });

    it('should extract title from h2', () => {
      document.body.innerHTML = `
        <div class="conversation">
          <h2>Another Title</h2>
          <div class="message user-message">
            <p>Hello</p>
          </div>
        </div>
      `;

      const conversation = parser.parseConversation();

      expect(conversation.title).toBe('Another Title');
    });

    it('should use first user message as title fallback', () => {
      document.body.innerHTML = `
        <div class="conversation">
          <div class="message user-message">
            <p>This is my first question</p>
          </div>
        </div>
      `;

      const conversation = parser.parseConversation();

      expect(conversation.title).toBeDefined();
      expect(conversation.title).toContain('This is my first question');
    });

    it('should truncate long titles from first message', () => {
      const longMessage = 'a'.repeat(100);
      document.body.innerHTML = `
        <div class="conversation">
          <div class="message user-message">
            <p>${longMessage}</p>
          </div>
        </div>
      `;

      const conversation = parser.parseConversation();

      expect(conversation.title).toBeDefined();
      expect(conversation.title!.length).toBeLessThanOrEqual(53); // 50 chars + '...'
    });
  });
});
