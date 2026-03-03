/**
 * Tests for DOM Selectors Configuration
 */

import { 
  DEFAULT_CLAUDE_SELECTORS, 
  FALLBACK_CONVERSATION_SELECTORS,
  createCustomSelectors,
  validateSelectors
} from '../../src/config/domSelectors';
import { DOMSelectors } from '../../src/types';

describe('DOM Selectors Configuration', () => {
  describe('DEFAULT_CLAUDE_SELECTORS', () => {
    it('should have all required selector properties', () => {
      expect(DEFAULT_CLAUDE_SELECTORS).toHaveProperty('conversationContainer');
      expect(DEFAULT_CLAUDE_SELECTORS).toHaveProperty('messageContainer');
      expect(DEFAULT_CLAUDE_SELECTORS).toHaveProperty('userMessage');
      expect(DEFAULT_CLAUDE_SELECTORS).toHaveProperty('assistantMessage');
      expect(DEFAULT_CLAUDE_SELECTORS).toHaveProperty('codeBlock');
      expect(DEFAULT_CLAUDE_SELECTORS).toHaveProperty('codeLanguage');
      expect(DEFAULT_CLAUDE_SELECTORS).toHaveProperty('table');
      expect(DEFAULT_CLAUDE_SELECTORS).toHaveProperty('image');
    });

    it('should have non-empty string values for all selectors', () => {
      Object.values(DEFAULT_CLAUDE_SELECTORS).forEach(selector => {
        expect(typeof selector).toBe('string');
        expect(selector.length).toBeGreaterThan(0);
      });
    });

    it('should have valid CSS selector syntax', () => {
      // Test that each selector can be used with querySelector
      // We don't expect them to match anything in the test environment,
      // but they should be valid CSS selectors
      Object.entries(DEFAULT_CLAUDE_SELECTORS).forEach(([key, selector]) => {
        expect(() => {
          // Split by comma for multi-selectors and test each part
          const selectors = selector.split(',').map((s: string) => s.trim());
          selectors.forEach((s: string) => {
            // This will throw if the selector is invalid
            document.querySelector(s);
          });
        }).not.toThrow();
      });
    });

    it('should include fallback selectors in conversationContainer', () => {
      const selector = DEFAULT_CLAUDE_SELECTORS.conversationContainer;
      expect(selector).toContain('main');
      expect(selector).toContain('[role="main"]');
      expect(selector).toContain('body');
    });

    it('should include multiple options for message selectors', () => {
      const messageSelector = DEFAULT_CLAUDE_SELECTORS.messageContainer;
      expect(messageSelector).toContain('message');
      
      const userSelector = DEFAULT_CLAUDE_SELECTORS.userMessage;
      expect(userSelector).toContain('user');
      
      const assistantSelector = DEFAULT_CLAUDE_SELECTORS.assistantMessage;
      expect(assistantSelector).toContain('assistant');
    });
  });

  describe('FALLBACK_CONVERSATION_SELECTORS', () => {
    it('should be an array of selector strings', () => {
      expect(Array.isArray(FALLBACK_CONVERSATION_SELECTORS)).toBe(true);
      expect(FALLBACK_CONVERSATION_SELECTORS.length).toBeGreaterThan(0);
      
      FALLBACK_CONVERSATION_SELECTORS.forEach(selector => {
        expect(typeof selector).toBe('string');
        expect(selector.length).toBeGreaterThan(0);
      });
    });

    it('should include common container selectors', () => {
      expect(FALLBACK_CONVERSATION_SELECTORS).toContain('main');
      expect(FALLBACK_CONVERSATION_SELECTORS).toContain('[role="main"]');
      expect(FALLBACK_CONVERSATION_SELECTORS).toContain('body');
    });

    it('should have body as the last fallback', () => {
      const lastSelector = FALLBACK_CONVERSATION_SELECTORS[FALLBACK_CONVERSATION_SELECTORS.length - 1];
      expect(lastSelector).toBe('body');
    });
  });

  describe('createCustomSelectors', () => {
    it('should return default selectors when no overrides provided', () => {
      const result = createCustomSelectors({});
      expect(result).toEqual(DEFAULT_CLAUDE_SELECTORS);
    });

    it('should override specific selectors while keeping defaults', () => {
      const customContainer = '.my-custom-container';
      const result = createCustomSelectors({
        conversationContainer: customContainer
      });

      expect(result.conversationContainer).toBe(customContainer);
      expect(result.messageContainer).toBe(DEFAULT_CLAUDE_SELECTORS.messageContainer);
      expect(result.userMessage).toBe(DEFAULT_CLAUDE_SELECTORS.userMessage);
      expect(result.assistantMessage).toBe(DEFAULT_CLAUDE_SELECTORS.assistantMessage);
    });

    it('should allow overriding multiple selectors', () => {
      const overrides = {
        conversationContainer: '.custom-conversation',
        messageContainer: '.custom-message',
        codeBlock: '.custom-code'
      };

      const result = createCustomSelectors(overrides);

      expect(result.conversationContainer).toBe(overrides.conversationContainer);
      expect(result.messageContainer).toBe(overrides.messageContainer);
      expect(result.codeBlock).toBe(overrides.codeBlock);
      expect(result.table).toBe(DEFAULT_CLAUDE_SELECTORS.table);
    });

    it('should allow overriding all selectors', () => {
      const customSelectors: DOMSelectors = {
        conversationContainer: '.custom-conversation',
        messageContainer: '.custom-message',
        userMessage: '.custom-user',
        assistantMessage: '.custom-assistant',
        codeBlock: '.custom-code',
        codeLanguage: '.custom-language',
        table: '.custom-table',
        image: '.custom-image'
      };

      const result = createCustomSelectors(customSelectors);
      expect(result).toEqual(customSelectors);
    });
  });

  describe('validateSelectors', () => {
    it('should return true for valid default selectors', () => {
      expect(validateSelectors(DEFAULT_CLAUDE_SELECTORS)).toBe(true);
    });

    it('should return true for valid custom selectors', () => {
      const customSelectors: DOMSelectors = {
        conversationContainer: '.conversation',
        messageContainer: '.message',
        userMessage: '.user',
        assistantMessage: '.assistant',
        codeBlock: 'pre code',
        codeLanguage: '.language',
        table: 'table',
        image: 'img'
      };

      expect(validateSelectors(customSelectors)).toBe(true);
    });

    it('should return false for selectors with empty strings', () => {
      const invalidSelectors: DOMSelectors = {
        ...DEFAULT_CLAUDE_SELECTORS,
        conversationContainer: ''
      };

      expect(validateSelectors(invalidSelectors)).toBe(false);
    });

    it('should return false for selectors with missing properties', () => {
      const invalidSelectors = {
        conversationContainer: '.conversation',
        messageContainer: '.message',
        userMessage: '.user'
        // Missing other required properties
      } as DOMSelectors;

      expect(validateSelectors(invalidSelectors)).toBe(false);
    });

    it('should validate all required properties', () => {
      const requiredKeys: (keyof DOMSelectors)[] = [
        'conversationContainer',
        'messageContainer',
        'userMessage',
        'assistantMessage',
        'codeBlock',
        'codeLanguage',
        'table',
        'image'
      ];

      requiredKeys.forEach(key => {
        const invalidSelectors: DOMSelectors = {
          ...DEFAULT_CLAUDE_SELECTORS,
          [key]: ''
        };

        expect(validateSelectors(invalidSelectors)).toBe(false);
      });
    });
  });

  describe('Selector Integration', () => {
    it('should work with ContentParser expectations', () => {
      // Verify that the selectors match the interface expected by ContentParser
      const selectors = DEFAULT_CLAUDE_SELECTORS;
      
      // These are the properties ContentParser uses
      expect(selectors.conversationContainer).toBeDefined();
      expect(selectors.messageContainer).toBeDefined();
      expect(selectors.userMessage).toBeDefined();
      expect(selectors.assistantMessage).toBeDefined();
      expect(selectors.codeBlock).toBeDefined();
      expect(selectors.codeLanguage).toBeDefined();
      expect(selectors.table).toBeDefined();
      expect(selectors.image).toBeDefined();
    });

    it('should be compatible with querySelector API', () => {
      // Create a mock DOM structure
      document.body.innerHTML = `
        <main>
          <div class="message font-user-message">User message</div>
          <div class="message font-claude-message">
            <p>Assistant message</p>
            <pre><code class="language-javascript">const x = 1;</code></pre>
            <table><tr><td>Data</td></tr></table>
            <img src="test.jpg" alt="Test" />
          </div>
        </main>
      `;

      // Test that selectors can find elements
      const conversationContainer = document.querySelector(
        DEFAULT_CLAUDE_SELECTORS.conversationContainer.split(',')[0]
      );
      expect(conversationContainer).not.toBeNull();

      const codeBlock = document.querySelector(
        DEFAULT_CLAUDE_SELECTORS.codeBlock.split(',')[0]
      );
      expect(codeBlock).not.toBeNull();

      const table = document.querySelector(DEFAULT_CLAUDE_SELECTORS.table);
      expect(table).not.toBeNull();

      const image = document.querySelector(DEFAULT_CLAUDE_SELECTORS.image);
      expect(image).not.toBeNull();
    });
  });
});
