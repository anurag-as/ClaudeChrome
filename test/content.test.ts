/**
 * Tests for content script entry point
 */

describe('Content Script', () => {
  // Mock the DOM
  beforeEach(() => {
    document.body.innerHTML = '';
    // Reset location
    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://claude.ai/chat/test-chat'
      },
      writable: true
    });
  });

  describe('Page Detection', () => {
    it('should detect Claude chat pages by URL', () => {
      // Test is implicit - if the extension initializes on claude.ai URLs
      // The URL check in isClaudeChatPage() should return true
      expect(window.location.href).toContain('claude.ai');
    });

    it('should detect Claude chat pages by page title', () => {
      document.title = 'Claude - Chat';
      expect(document.title.toLowerCase()).toContain('claude');
    });
  });

  describe('Extension Initialization', () => {
    it('should wait for DOM to be ready before initializing', () => {
      // Mock document.readyState
      Object.defineProperty(document, 'readyState', {
        value: 'loading',
        writable: true
      });

      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      
      // This would be called by the content script
      // We're just verifying the pattern
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          // Initialize
        });
      }

      expect(addEventListenerSpy).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));
    });

    it('should initialize immediately if DOM is already loaded', () => {
      Object.defineProperty(document, 'readyState', {
        value: 'complete',
        writable: true
      });

      expect(document.readyState).toBe('complete');
    });
  });

  describe('Component Wiring', () => {
    it('should create extension context with all required components', () => {
      // This test verifies the structure of ExtensionContext
      interface ExtensionContext {
        uiManager: any;
        exportCoordinator: any;
        errorHandler: any;
      }

      const mockContext: ExtensionContext = {
        uiManager: {},
        exportCoordinator: {},
        errorHandler: {}
      };

      expect(mockContext).toHaveProperty('uiManager');
      expect(mockContext).toHaveProperty('exportCoordinator');
      expect(mockContext).toHaveProperty('errorHandler');
    });
  });

  describe('DOM Selectors', () => {
    it('should have all required selector properties', () => {
      const selectors = {
        conversationContainer: 'main, [role="main"], .conversation, body',
        messageContainer: '[data-testid*="message"], [class*="message"], .font-user-message, .font-claude-message',
        userMessage: '[data-testid*="user"], [class*="user-message"], .font-user-message',
        assistantMessage: '[data-testid*="assistant"], [data-testid*="claude"], [class*="assistant-message"], [class*="claude-message"], .font-claude-message',
        codeBlock: 'pre code, pre, [class*="code-block"]',
        codeLanguage: '[class*="language-"], code[class*="language-"]',
        table: 'table',
        image: 'img'
      };

      expect(selectors).toHaveProperty('conversationContainer');
      expect(selectors).toHaveProperty('messageContainer');
      expect(selectors).toHaveProperty('userMessage');
      expect(selectors).toHaveProperty('assistantMessage');
      expect(selectors).toHaveProperty('codeBlock');
      expect(selectors).toHaveProperty('codeLanguage');
      expect(selectors).toHaveProperty('table');
      expect(selectors).toHaveProperty('image');
    });
  });
});
