import { ChatConversation, DOMSelectors } from '../types';
import { MessageExtractor } from './MessageExtractor';
import { CodeBlockExtractor } from './CodeBlockExtractor';
import { TableExtractor } from './TableExtractor';
import { ImageExtractor } from './ImageExtractor';
import { FALLBACK_CONVERSATION_SELECTORS } from '../config/domSelectors';

export class ContentParser {
  private messageExtractor: MessageExtractor;
  private selectors: DOMSelectors;

  constructor(selectors: DOMSelectors) {
    this.selectors = selectors;
    
    const codeBlockExtractor = new CodeBlockExtractor(selectors);
    const tableExtractor = new TableExtractor(selectors);
    const imageExtractor = new ImageExtractor(selectors);
    
    this.messageExtractor = new MessageExtractor(
      selectors,
      codeBlockExtractor,
      tableExtractor,
      imageExtractor
    );
  }

  /**
   * Parse the entire conversation from the page
   */
  parseConversation(): ChatConversation {
    const container = this.findConversationContainer();
    if (!container) {
      throw new Error('Conversation container not found');
    }

    const messages = this.messageExtractor.extractMessages(container);

    const title = this.extractTitle(container);
    const timestamp = new Date();

    return {
      messages,
      title,
      timestamp
    };
  }

  /**
   * Find the main conversation container element
   * 
   * This method implements a multi-level fallback strategy:
   * 1. Try the configured selector (may contain multiple comma-separated options)
   * 2. Try centralized fallback selectors from config
   * 3. Verify found containers actually contain messages
   * 4. Last resort: return document.body
   * 
   * This approach ensures the parser works even if Claude's UI structure changes.
   */
  private findConversationContainer(): HTMLElement | null {
    const container = document.querySelector(this.selectors.conversationContainer);
    if (container instanceof HTMLElement) {
      return container;
    }

    for (const selector of FALLBACK_CONVERSATION_SELECTORS) {
      const element = document.querySelector(selector);
      if (element instanceof HTMLElement) {
        const hasMessages = element.querySelector(this.selectors.messageContainer);
        if (hasMessages) {
          return element;
        }
      }
    }

    return document.body;
  }

  /**
   * Extract the conversation title
   */
  private extractTitle(container: HTMLElement): string | undefined {
    const titleSelectors = [
      'h1',
      'h2',
      '.title',
      '.conversation-title',
      '[data-title]',
      'header h1',
      'header h2'
    ];

    for (const selector of titleSelectors) {
      const titleElement = container.querySelector(selector) || 
                          document.querySelector(selector);
      
      if (titleElement) {
        const title = titleElement.textContent?.trim();
        if (title && title.length > 0 && title.length < 200) {
          return title;
        }
      }
    }

    const pageTitle = document.title;
    if (pageTitle && pageTitle !== 'Claude') {
      const cleanTitle = pageTitle
        .replace(/\s*[-|]\s*Claude.*$/i, '')
        .replace(/\s*[-|]\s*Anthropic.*$/i, '')
        .trim();
      
      if (cleanTitle.length > 0) {
        return cleanTitle;
      }
    }

    const firstMessage = container.querySelector(this.selectors.userMessage);
    if (firstMessage) {
      const firstMessageText = firstMessage.textContent?.trim();
      if (firstMessageText && firstMessageText.length > 0) {
        return firstMessageText.length > 50 
          ? firstMessageText.substring(0, 50) + '...'
          : firstMessageText;
      }
    }

    return undefined;
  }
}
