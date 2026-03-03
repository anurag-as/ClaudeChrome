import { ChatConversation, ChatElement, TextElement, CodeBlockElement, TableElement, ImageElement } from '../types';

export class MarkdownExporter {
  /**
   * Generate a Markdown string from a chat conversation
   */
  generate(conversation: ChatConversation): string {
    const parts: string[] = [];

    parts.push(this.generateHeader(conversation));
    parts.push('');

    for (const message of conversation.messages) {
      parts.push(this.formatMessage(message));
      parts.push('');
    }

    return parts.join('\n');
  }

  /**
   * Generate the conversation header with title and timestamp
   */
  private generateHeader(conversation: ChatConversation): string {
    const parts: string[] = [];

    if (conversation.title) {
      // Title doesn't need escaping - it's plain text
      parts.push(`# ${conversation.title}`);
      parts.push('');
    }

    const formattedDate = conversation.timestamp.toLocaleString();
    parts.push(`*Exported: ${formattedDate}*`);

    return parts.join('\n');
  }

  /**
   * Format a single message with role indicator and content
   */
  private formatMessage(message: ChatConversation['messages'][0]): string {
    const parts: string[] = [];

    const roleLabel = message.role === 'user' ? '**User**' : '**Assistant**';
    parts.push(`${roleLabel}:`);
    parts.push('');

    for (const element of message.content) {
      parts.push(this.formatElement(element));
      parts.push('');
    }

    return parts.join('\n');
  }

  /**
   * Format a chat element based on its type
   */
  private formatElement(element: ChatElement): string {
    switch (element.type) {
      case 'text':
        return this.formatText(element);
      case 'code':
        return this.formatCodeBlock(element);
      case 'table':
        return this.formatTable(element);
      case 'image':
        return this.formatImage(element);
      default:
        return '';
    }
  }

  /**
   * Format text content - text is already in markdown format from htmlToMarkdown
   */
  private formatText(element: TextElement): string {
    // Text is already in markdown format, don't escape it
    return element.content;
  }

  /**
   * Escape special Markdown characters in text
   */
  private escapeMarkdown(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\*/g, '\\*')
      .replace(/_/g, '\\_')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/`/g, '\\`')
      .replace(/^(#{1,6})\s/gm, '\\$1 ');
  }

  /**
   * Format code block with fenced code blocks and language identifier
   */
  private formatCodeBlock(element: CodeBlockElement): string {
    const language = element.language || '';
    return `\`\`\`${language}\n${element.code}\n\`\`\``;
  }

  /**
   * Format table with Markdown table syntax
   */
  private formatTable(element: TableElement): string {
    if (element.headers.length === 0 && element.rows.length === 0) {
      return '';
    }

    const parts: string[] = [];

    if (element.headers.length > 0) {
      const headerRow = '| ' + element.headers.map(h => this.escapeMarkdown(h)).join(' | ') + ' |';
      parts.push(headerRow);

      const separator = '| ' + element.headers.map(() => '---').join(' | ') + ' |';
      parts.push(separator);
    }

    for (const row of element.rows) {
      const rowStr = '| ' + row.map(cell => this.escapeMarkdown(cell)).join(' | ') + ' |';
      parts.push(rowStr);
    }

    return parts.join('\n');
  }

  /**
   * Format image with alt text and inline link
   */
  private formatImage(element: ImageElement): string {
    const alt = element.alt ? this.escapeMarkdown(element.alt) : '';
    return `![${alt}](${element.src})`;
  }
}
