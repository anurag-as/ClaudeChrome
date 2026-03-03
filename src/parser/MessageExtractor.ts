import { ChatMessage, ChatElement, DOMSelectors } from '../types';
import { CodeBlockExtractor } from './CodeBlockExtractor';
import { TableExtractor } from './TableExtractor';
import { ImageExtractor } from './ImageExtractor';

export class MessageExtractor {
  private codeBlockExtractor: CodeBlockExtractor;
  private tableExtractor: TableExtractor;
  private imageExtractor: ImageExtractor;
  private seenCodeBlocks: Set<string> = new Set();
  private processedElements: Set<HTMLElement> = new Set();

  constructor(
    private selectors: DOMSelectors,
    codeBlockExtractor?: CodeBlockExtractor,
    tableExtractor?: TableExtractor,
    imageExtractor?: ImageExtractor
  ) {
    this.codeBlockExtractor = codeBlockExtractor || new CodeBlockExtractor(selectors);
    this.tableExtractor = tableExtractor || new TableExtractor(selectors);
    this.imageExtractor = imageExtractor || new ImageExtractor(selectors);
  }

  /**
   * Extract all messages from the conversation container
   * Preserves chronological order
   */
  extractMessages(container: HTMLElement): ChatMessage[] {
    const messageElements = container.querySelectorAll(this.selectors.messageContainer);
    const messages: ChatMessage[] = [];

    // Reset seen code blocks for each conversation
    this.seenCodeBlocks.clear();

    messageElements.forEach((element) => {
      if (element instanceof HTMLElement) {
        const role = this.identifyRole(element);
        const content = this.extractContent(element);
        
        messages.push({
          role,
          content,
          timestamp: this.extractTimestamp(element)
        });
      }
    });

    return messages;
  }

  /**
   * Identify whether a message is from the user or assistant
   */
  identifyRole(messageElement: HTMLElement): 'user' | 'assistant' {
    if (messageElement.matches(this.selectors.userMessage)) {
      return 'user';
    }
    
    if (messageElement.matches(this.selectors.assistantMessage)) {
      return 'assistant';
    }

    const classList = messageElement.className.toLowerCase();
    const dataRole = messageElement.getAttribute('data-role')?.toLowerCase();
    
    if (classList.includes('user') || dataRole === 'user') {
      return 'user';
    }
    
    if (classList.includes('assistant') || classList.includes('claude') || dataRole === 'assistant') {
      return 'assistant';
    }

    return 'assistant';
  }

  /**
   * Extract all content elements from a message in their original order
   */
  private extractContent(messageElement: HTMLElement): ChatElement[] {
    const content: ChatElement[] = [];
    
    // Reset processed elements for each message
    this.processedElements.clear();
    
    // Walk through the DOM tree and extract elements in order
    this.extractContentInOrder(messageElement, content);
    
    return content;
  }

  /**
   * Recursively extract content elements in their DOM order
   */
  private extractContentInOrder(element: HTMLElement, content: ChatElement[]): void {
    // Skip if we've already processed this element
    if (this.processedElements.has(element)) {
      return;
    }
    
    // Check if this element itself is a special element container
    if (this.isCodeBlockContainer(element)) {
      this.processedElements.add(element);
      const wrapper = element.ownerDocument.createElement('div');
      wrapper.appendChild(element.cloneNode(true));
      const codeBlocks = this.codeBlockExtractor.extractCodeBlocks(wrapper, this.seenCodeBlocks);
      content.push(...codeBlocks);
      return;
    }
    
    if (this.isTable(element)) {
      const wrapper = element.ownerDocument.createElement('div');
      wrapper.appendChild(element.cloneNode(true));
      const tables = this.tableExtractor.extractTables(wrapper);
      content.push(...tables);
      return;
    }
    
    if (this.isImage(element)) {
      const wrapper = element.ownerDocument.createElement('div');
      wrapper.appendChild(element.cloneNode(true));
      const images = this.imageExtractor.extractImages(wrapper);
      content.push(...images);
      return;
    }
    
    // Walk through child nodes in order
    let textBuffer = '';
    
    for (const node of Array.from(element.childNodes)) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const childElement = node as HTMLElement;
        
        // Check if child is a special element
        if (this.isCodeBlockContainer(childElement) || this.isTable(childElement) || this.isImage(childElement)) {
          // Flush any accumulated text first
          if (textBuffer.trim()) {
            content.push({
              type: 'text',
              content: textBuffer.trim()
            });
            textBuffer = '';
          }
          
          // Extract the special element
          this.extractContentInOrder(childElement, content);
        } else if (this.containsSpecialElements(childElement)) {
          // Child contains special elements, need to recurse
          if (textBuffer.trim()) {
            content.push({
              type: 'text',
              content: textBuffer.trim()
            });
            textBuffer = '';
          }
          
          // Recurse into child
          this.extractContentInOrder(childElement, content);
        } else {
          // Regular element with no special children - extract as text
          const markdown = this.htmlToMarkdown(childElement);
          if (markdown.trim()) {
            textBuffer += (textBuffer ? '\n\n' : '') + markdown;
          }
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        // Accumulate text nodes
        const text = node.textContent || '';
        if (text.trim()) {
          textBuffer += text;
        }
      }
    }
    
    // Flush any remaining text
    if (textBuffer.trim()) {
      content.push({
        type: 'text',
        content: textBuffer.trim()
      });
    }
  }
  
  private isCodeBlockContainer(element: HTMLElement): boolean {
    // Code blocks are typically <pre> elements containing <code>
    // We want to match the <pre>, not the inner <code>
    return element.tagName.toLowerCase() === 'pre' || 
           element.classList.contains('code-block');
  }
  
  private isTable(element: HTMLElement): boolean {
    return element.tagName.toLowerCase() === 'table';
  }
  
  private isImage(element: HTMLElement): boolean {
    return element.tagName.toLowerCase() === 'img';
  }
  
  private containsSpecialElements(element: HTMLElement): boolean {
    return !!(
      element.querySelector('pre') ||
      element.querySelector('table') ||
      element.querySelector('img')
    );
  }

  /**
   * Extract only text content, excluding code blocks, tables, and images
   * Converts HTML formatting to Markdown
   */
  private extractTextOnly(element: HTMLElement): string {
    const clone = element.cloneNode(true) as HTMLElement;

    // Remove code blocks and their parent containers
    clone.querySelectorAll(this.selectors.codeBlock).forEach(el => {
      const parent = el.parentElement;
      if (parent && (parent.classList.contains('code-block') || parent.classList.contains('overflow-x-auto'))) {
        parent.remove();
      } else {
        el.remove();
      }
    });
    
    // Remove tables and their containers
    clone.querySelectorAll(this.selectors.table).forEach(el => {
      const parent = el.parentElement;
      if (parent && parent.classList.contains('overflow-x-auto')) {
        parent.remove();
      } else {
        el.remove();
      }
    });
    
    // Remove images and their containers
    clone.querySelectorAll(this.selectors.image).forEach(el => {
      let parent = el.parentElement;
      let depth = 0;
      while (parent && depth < 3) {
        if (parent.classList.contains('grid') || parent.classList.contains('my-2')) {
          parent.remove();
          break;
        }
        parent = parent.parentElement;
        depth++;
      }
      if (depth === 3) {
        el.remove();
      }
    });

    // Remove common UI elements
    clone.querySelectorAll('button, [role="button"], .button').forEach(el => el.remove());
    
    // Remove web search UI elements but keep the main content
    clone.querySelectorAll('[class*="search"]').forEach(el => {
      // Only remove if it looks like a search UI element, not content
      const text = el.textContent?.trim() || '';
      if (text === 'Searched the web' || text === 'Done' || text.length < 10) {
        el.remove();
      }
    });
    
    // Convert HTML to Markdown
    const markdown = this.htmlToMarkdown(clone);
    
    // Clean up
    let text = markdown
      .replace(/Language:\s*\w+\s*/gi, '')
      .replace(/VectorStock|Vecteezy|Freepik|Results from the web/gi, '')
      .replace(/Image\s*$/gi, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    return text;
  }

  /**
   * Convert HTML element to Markdown, preserving formatting
   */
  private htmlToMarkdown(element: HTMLElement): string {
    let markdown = '';
    
    const processNode = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        // Filter out standalone language names (python, javascript, etc.)
        const trimmed = text.trim().toLowerCase();
        if (trimmed && this.isLanguageName(trimmed)) {
          return '';
        }
        return text;
      }
      
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return '';
      }
      
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();
      
      // Skip language labels (common in code block UI)
      const classList = Array.from(el.classList).join(' ').toLowerCase();
      if (classList.includes('language') || 
          classList.includes('lang') ||
          el.getAttribute('data-language') ||
          el.hasAttribute('data-lexical-text')) {
        const text = el.textContent?.trim().toLowerCase() || '';
        if (this.isLanguageName(text)) {
          return '';
        }
      }
      
      let content = '';
      
      // Process children
      for (const child of Array.from(el.childNodes)) {
        content += processNode(child);
      }
      
      // Apply formatting based on tag
      switch (tagName) {
        case 'strong':
        case 'b':
          return `**${content}**`;
        
        case 'em':
        case 'i':
          return `*${content}*`;
        
        case 'code':
          // Inline code only (block code is handled separately)
          if (!el.closest('pre')) {
            return `\`${content}\``;
          }
          return content;
        
        case 'pre':
          // Block code is handled separately by CodeBlockExtractor
          return '';
        
        case 'table':
          // Tables are handled separately by TableExtractor
          return '';
        
        case 'img':
          // Images are handled separately by ImageExtractor
          return '';
        
        case 'a':
          const href = el.getAttribute('href');
          if (href && !href.startsWith('#')) {
            // Skip favicon/icon links
            if (href.includes('favicon') || href.includes('s2/favicons')) {
              return '';
            }
            return `[${content}](${href})`;
          }
          return content;
        
        case 'p':
          return content + '\n\n';
        
        case 'br':
          return '\n';
        
        case 'h1':
          return `# ${content}\n\n`;
        case 'h2':
          return `## ${content}\n\n`;
        case 'h3':
          return `### ${content}\n\n`;
        case 'h4':
          return `#### ${content}\n\n`;
        case 'h5':
          return `##### ${content}\n\n`;
        case 'h6':
          return `###### ${content}\n\n`;
        
        case 'ul':
        case 'ol':
          return '\n' + content + '\n';
        
        case 'li':
          const listParent = el.parentElement;
          const isOrdered = listParent?.tagName.toLowerCase() === 'ol';
          const index = Array.from(listParent?.children || []).indexOf(el) + 1;
          const bullet = isOrdered ? `${index}.` : '-';
          return `${bullet} ${content}\n`;
        
        case 'blockquote':
          return content.split('\n').map(line => `> ${line}`).join('\n') + '\n\n';
        
        case 'hr':
          return '\n---\n\n';
        
        case 'div':
        case 'span':
        case 'section':
        case 'article':
          // Just pass through content for generic containers
          return content;
        
        default:
          return content;
      }
    };
    
    markdown = processNode(element);
    
    // Clean up excessive newlines
    markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();
    
    return markdown;
  }

  /**
   * Check if a string is a programming language name
   */
  private isLanguageName(text: string): boolean {
    const languageNames = [
      'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'c++', 'csharp', 'c#',
      'ruby', 'go', 'rust', 'php', 'swift', 'kotlin', 'scala', 'r',
      'perl', 'lua', 'haskell', 'elixir', 'clojure', 'dart', 'julia',
      'bash', 'shell', 'powershell', 'sql', 'html', 'css', 'scss', 'sass',
      'json', 'xml', 'yaml', 'toml', 'markdown', 'text', 'plaintext',
      'jsx', 'tsx', 'vue', 'svelte', 'graphql', 'dockerfile', 'makefile',
      'js', 'ts', 'py', 'rb', 'sh', 'yml', 'md'
    ];
    return languageNames.includes(text.toLowerCase());
  }

  /**
   * Extract timestamp from message element if available
   */
  private extractTimestamp(messageElement: HTMLElement): Date | undefined {
    const timestampSelectors = [
      '[data-timestamp]',
      '.timestamp',
      'time',
      '[datetime]'
    ];

    for (const selector of timestampSelectors) {
      const timestampEl = messageElement.querySelector(selector);
      if (timestampEl) {
        const timestamp = timestampEl.getAttribute('data-timestamp') ||
                         timestampEl.getAttribute('datetime') ||
                         timestampEl.textContent;
        
        if (timestamp) {
          const date = new Date(timestamp);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
      }
    }

    return undefined;
  }
}
