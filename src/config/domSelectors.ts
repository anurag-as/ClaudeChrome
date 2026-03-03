/**
 * DOM Selectors Configuration for Claude Chat Pages
 * 
 * This file contains the DOM selectors used to identify and extract chat elements
 * from Claude AI chat pages. These selectors are based on common chat UI patterns
 * and may need to be updated if Claude's UI structure changes.
 * 
 * 
 * SELECTOR STRATEGY:
 * - Primary selectors target specific data attributes or class names
 * - Multiple comma-separated selectors provide fallback options
 * - Generic selectors (like 'main', 'table') serve as last-resort fallbacks
 */

import { DOMSelectors } from '../types';

/**
 * Default DOM selectors for Claude chat pages
 * 
 * These selectors are designed to work with Claude's current UI structure.
 * Each selector may contain multiple comma-separated options for fallback.
 */
export const DEFAULT_CLAUDE_SELECTORS: DOMSelectors = {
  /**
   * CONVERSATION CONTAINER
   * 
   * The main container holding the entire conversation.
   * 
   * Selector strategy:
   * - 'main': Standard HTML5 main element (most common)
   * - '[role="main"]': ARIA role for main content
   * - '.conversation': Common class name for chat containers
   * - 'body': Ultimate fallback
   * 
   * Expected structure:
   * <main>
   *   <div class="message">...</div>
   *   <div class="message">...</div>
   * </main>
   */
  conversationContainer: 'main, [role="main"], .conversation, body',

  /**
   * MESSAGE CONTAINER
   * 
   * Individual message elements within the conversation.
   * Each message represents one turn in the conversation (user or assistant).
   * 
   * Selector strategy:
   * - '[data-testid="user-message"]': User messages
   * - '[data-test-render-count]': Assistant messages (Claude's responses)
   * - '[data-testid*="message"]': Fallback for any message with testid
   * - '[class*="message"]': Fallback for class-based messages
   */
  messageContainer: '[data-testid="user-message"], [data-test-render-count], [data-testid*="message"], [class*="message"]',

  /**
   * USER MESSAGE
   * 
   * Messages sent by the user (as opposed to Claude's responses).
   * 
   * Selector strategy:
   * - '[data-testid*="user"]': Test IDs containing "user"
   * - '[class*="user-message"]': Class names containing "user-message"
   * - '.font-user-message': Specific Claude class for user messages
   * 
   * Expected attributes:
   * - May have data-testid="user-message" or similar
   * - May have class="font-user-message" or similar
   * - Should contain text content or nested elements
   */
  userMessage: '[data-testid*="user"], [class*="user-message"], .font-user-message',

  /**
   * ASSISTANT MESSAGE
   * 
   * Messages sent by Claude (the AI assistant).
   * 
   * Selector strategy:
   * - '[data-testid*="assistant"]': Test IDs containing "assistant"
   * - '[data-testid*="claude"]': Test IDs containing "claude"
   * - '[class*="assistant-message"]': Class names containing "assistant-message"
   * - '[class*="claude-message"]': Class names containing "claude-message"
   * - '.font-claude-message': Specific Claude class for assistant messages
   * 
   * Expected attributes:
   * - May have data-testid="assistant-message" or similar
   * - May have class="font-claude-message" or similar
   * - Should contain text content or nested elements (code, tables, images)
   */
  assistantMessage: '[data-testid*="assistant"], [data-testid*="claude"], [class*="assistant-message"], [class*="claude-message"], .font-claude-message',

  /**
   * CODE BLOCK
   * 
   * Code blocks within messages, typically with syntax highlighting.
   * 
   * Selector strategy:
   * - 'pre code': Standard HTML structure for code blocks
   * - 'pre': Pre-formatted text (may contain code)
   * - '[class*="code-block"]': Class names containing "code-block"
   * 
   * Expected structure:
   * <pre>
   *   <code class="language-javascript">
   *     const x = 1;
   *   </code>
   * </pre>
   * 
   * OR:
   * 
   * <div class="code-block">
   *   <pre><code>...</code></pre>
   * </div>
   */
  codeBlock: 'pre code, pre, [class*="code-block"]',

  /**
   * CODE LANGUAGE
   * 
   * Element or attribute indicating the programming language of a code block.
   * 
   * Selector strategy:
   * - '[class*="language-"]': Class names like "language-javascript"
   * - 'code[class*="language-"]': Code elements with language classes
   * 
   * Expected structure:
   * <code class="language-python">...</code>
   * 
   * Language extraction:
   * - Extract from class name: "language-python" -> "python"
   * - May also check data attributes: data-language="python"
   */
  codeLanguage: '[class*="language-"], code[class*="language-"]',

  /**
   * TABLE
   * 
   * HTML tables within messages.
   * 
   * Selector strategy:
   * - 'table': Standard HTML table element
   * 
   * Expected structure:
   * <table>
   *   <thead>
   *     <tr>
   *       <th>Header 1</th>
   *       <th>Header 2</th>
   *     </tr>
   *   </thead>
   *   <tbody>
   *     <tr>
   *       <td>Data 1</td>
   *       <td>Data 2</td>
   *     </tr>
   *   </tbody>
   * </table>
   */
  table: 'table',

  /**
   * IMAGE
   * 
   * Images within messages (uploaded by user or generated by Claude).
   * 
   * Selector strategy:
   * - 'img': Standard HTML image element
   * 
   * Expected attributes:
   * - src: Image URL or data URI
   * - alt: Alternative text (optional)
   * 
   * Expected structure:
   * <img src="https://..." alt="Description" />
   * 
   * OR:
   * 
   * <img src="data:image/png;base64,..." alt="Description" />
   */
  image: 'img'
};

/**
 * Fallback selectors for conversation container
 * 
 * These are used by ContentParser when the primary selector fails.
 * Ordered from most specific to most generic.
 */
export const FALLBACK_CONVERSATION_SELECTORS = [
  'main',
  '[role="main"]',
  '.conversation',
  '.chat-container',
  '#conversation',
  '.messages',
  'body'
];

/**
 * Create a custom DOMSelectors configuration
 * 
 * This function allows overriding specific selectors while keeping defaults for others.
 * Useful for testing or adapting to UI changes without modifying the default configuration.
 * 
 * @param overrides - Partial DOMSelectors object with custom selectors
 * @returns Complete DOMSelectors configuration
 * 
 * @example
 * ```typescript
 * const customSelectors = createCustomSelectors({
 *   conversationContainer: '.custom-chat-container',
 *   messageContainer: '.custom-message'
 * });
 * ```
 */
export function createCustomSelectors(overrides: Partial<DOMSelectors>): DOMSelectors {
  return {
    ...DEFAULT_CLAUDE_SELECTORS,
    ...overrides
  };
}

/**
 * Validate that a selector configuration is complete
 * 
 * @param selectors - DOMSelectors configuration to validate
 * @returns True if all required selectors are present
 */
export function validateSelectors(selectors: DOMSelectors): boolean {
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

  return requiredKeys.every(key => {
    const value = selectors[key];
    return typeof value === 'string' && value.length > 0;
  });
}
