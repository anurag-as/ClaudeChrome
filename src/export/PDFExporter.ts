import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ChatConversation, ChatMessage, ChatElement, TextElement, CodeBlockElement, TableElement, ImageElement } from '../types';

export interface PDFOptions {
  fontSize: number;
  fontFamily: string;
  margins: { top: number; right: number; bottom: number; left: number };
  codeBlockStyle: CodeBlockStyle;
}

export interface CodeBlockStyle {
  backgroundColor: string;
  fontSize: number;
  fontFamily: string;
}

export class PDFExporter {
  private options: PDFOptions;
  private doc: jsPDF | null = null;
  private currentY: number = 0;
  private pageHeight: number = 0;
  private pageWidth: number = 0;

  constructor(options?: Partial<PDFOptions>) {
    this.options = {
      fontSize: 11,
      fontFamily: 'helvetica',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      codeBlockStyle: {
        backgroundColor: '#f5f5f5',
        fontSize: 9,
        fontFamily: 'courier'
      },
      ...options
    };
  }

  async generate(conversation: ChatConversation): Promise<Blob> {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.currentY = this.options.margins.top;

    this.doc.setFont(this.options.fontFamily);
    this.doc.setFontSize(this.options.fontSize);

    this.renderHeader(conversation);

    for (const message of conversation.messages) {
      await this.renderMessage(message);
    }

    return this.doc.output('blob');
  }

  private renderHeader(conversation: ChatConversation): void {
    if (!this.doc) return;

    if (conversation.title) {
      const sanitizedTitle = this.sanitizeText(conversation.title);
      
      if (sanitizedTitle) {
        this.doc.setFontSize(16);
        this.doc.setFont(this.options.fontFamily, 'bold');
        this.doc.text(sanitizedTitle, this.options.margins.left, this.currentY);
        this.currentY += 10;
      }
    }

    this.doc.setFontSize(10);
    this.doc.setFont(this.options.fontFamily, 'normal');
    const dateStr = conversation.timestamp.toLocaleString();
    this.doc.text(`Exported: ${dateStr}`, this.options.margins.left, this.currentY);
    this.currentY += 10;

    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(
      this.options.margins.left,
      this.currentY,
      this.pageWidth - this.options.margins.right,
      this.currentY
    );
    this.currentY += 8;

    this.doc.setFontSize(this.options.fontSize);
  }

  private async renderMessage(message: ChatMessage): Promise<void> {
    if (!this.doc) return;

    this.checkPageBreak(15);

    this.doc.setFont(this.options.fontFamily, 'bold');
    const roleText = message.role === 'user' ? 'User:' : 'Assistant:';
    this.doc.text(roleText, this.options.margins.left, this.currentY);
    this.currentY += 7;

    this.doc.setFont(this.options.fontFamily, 'normal');

    for (const element of message.content) {
      await this.renderElement(element);
    }

    this.currentY += 5;
  }

  private async renderElement(element: ChatElement): Promise<void> {
    switch (element.type) {
      case 'text':
        this.renderText(element);
        break;
      case 'code':
        await this.renderCodeBlock(element);
        break;
      case 'table':
        this.renderTable(element);
        break;
      case 'image':
        await this.renderImage(element);
        break;
    }
  }

  private renderText(element: TextElement): void {
    if (!this.doc) return;

    const sanitizedText = this.sanitizeText(element.content);
    
    if (!sanitizedText) return;

    this.renderMarkdownText(sanitizedText);
  }

  /**
   * Parse markdown text and render with proper PDF formatting
   */
  private renderMarkdownText(text: string): void {
    if (!this.doc) return;

    const contentWidth = this.getContentWidth();
    const lines = text.split('\n');

    for (let line of lines) {
      line = line.trim();
      
      if (!line) {
        this.currentY += 3;
        continue;
      }

      // Handle headings
      if (line.startsWith('######')) {
        this.renderHeading(line.substring(6).trim(), 10);
        continue;
      }
      if (line.startsWith('#####')) {
        this.renderHeading(line.substring(5).trim(), 11);
        continue;
      }
      if (line.startsWith('####')) {
        this.renderHeading(line.substring(4).trim(), 12);
        continue;
      }
      if (line.startsWith('###')) {
        this.renderHeading(line.substring(3).trim(), 13);
        continue;
      }
      if (line.startsWith('##')) {
        this.renderHeading(line.substring(2).trim(), 14);
        continue;
      }
      if (line.startsWith('#')) {
        this.renderHeading(line.substring(1).trim(), 15);
        continue;
      }

      // Handle horizontal rules
      if (line === '---' || line === '***' || line === '___') {
        this.checkPageBreak(5);
        this.doc.setDrawColor(200, 200, 200);
        this.doc.line(
          this.options.margins.left,
          this.currentY,
          this.pageWidth - this.options.margins.right,
          this.currentY
        );
        this.currentY += 5;
        continue;
      }

      // Handle lists
      if (line.match(/^[-*+]\s/) || line.match(/^\d+\.\s/)) {
        this.renderListItem(line);
        continue;
      }

      // Handle blockquotes
      if (line.startsWith('>')) {
        this.renderBlockquote(line.substring(1).trim());
        continue;
      }

      // Regular paragraph with inline formatting
      this.renderParagraph(line, contentWidth);
    }

    this.currentY += 2;
  }

  /**
   * Render a heading with appropriate size
   */
  private renderHeading(text: string, fontSize: number): void {
    if (!this.doc) return;

    // Strip inline markdown from heading text
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
    text = text.replace(/__([^_]+)__/g, '$1');
    text = text.replace(/\*([^*]+)\*/g, '$1');
    text = text.replace(/_([^_]+)_/g, '$1');
    text = text.replace(/`([^`]+)`/g, '$1');
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');

    this.checkPageBreak(10);
    this.doc.setFont(this.options.fontFamily, 'bold');
    this.doc.setFontSize(fontSize);
    
    const contentWidth = this.getContentWidth();
    const lines = this.doc.splitTextToSize(text, contentWidth);
    
    for (const line of lines) {
      this.doc.text(line, this.options.margins.left, this.currentY);
      this.currentY += fontSize * 0.5;
    }
    
    this.doc.setFont(this.options.fontFamily, 'normal');
    this.doc.setFontSize(this.options.fontSize);
    this.currentY += 3;
  }

  /**
   * Render a list item
   */
  private renderListItem(line: string): void {
    if (!this.doc) return;

    this.checkPageBreak(7);
    
    const match = line.match(/^([-*+]|\d+\.)\s+(.+)$/);
    if (!match) return;
    
    const bullet = match[1];
    let content = match[2];
    
    const bulletWidth = 10;
    const contentWidth = this.getContentWidth() - bulletWidth;
    
    // Render bullet
    this.doc.text(bullet, this.options.margins.left, this.currentY);
    
    // Parse and render content with formatting
    this.renderFormattedText(content, this.options.margins.left + bulletWidth, contentWidth);
  }

  /**
   * Render text with inline formatting (bold, italic, inline code)
   */
  private renderFormattedText(text: string, startX: number, maxWidth: number): void {
    if (!this.doc) return;

    // First, extract and replace links with placeholders
    const links: Array<{placeholder: string, text: string, url: string}> = [];
    let linkIndex = 0;
    
    // Replace markdown links with placeholders
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
      const placeholder = `__LINK_${linkIndex}__`;
      links.push({ placeholder, text: linkText, url });
      linkIndex++;
      return placeholder;
    });

    // Parse text into segments with formatting
    const segments: Array<{text: string, bold?: boolean, italic?: boolean, code?: boolean, link?: {text: string, url: string}}> = [];
    
    // Process text character by character to handle nested/overlapping markdown
    let i = 0;
    let currentSegment = '';
    
    while (i < text.length) {
      // Check for link placeholder
      if (text.substring(i).startsWith('__LINK_')) {
        // Save any accumulated text
        if (currentSegment) {
          segments.push({ text: currentSegment });
          currentSegment = '';
        }
        
        // Extract link index
        const endIndex = text.indexOf('__', i + 7);
        if (endIndex !== -1) {
          const placeholder = text.substring(i, endIndex + 2);
          const link = links.find(l => l.placeholder === placeholder);
          if (link) {
            segments.push({ text: link.text, link: { text: link.text, url: link.url } });
            i = endIndex + 2;
            continue;
          }
        }
      }
      
      // Check for inline code (highest priority)
      if (text[i] === '`') {
        // Save any accumulated text
        if (currentSegment) {
          segments.push({ text: currentSegment });
          currentSegment = '';
        }
        
        // Find closing backtick
        let j = i + 1;
        while (j < text.length && text[j] !== '`') {
          j++;
        }
        
        if (j < text.length) {
          // Found closing backtick
          const codeText = text.substring(i + 1, j);
          segments.push({ text: codeText, code: true });
          i = j + 1;
          continue;
        }
      }
      
      // Check for bold (**text** or __text__)
      if ((text[i] === '*' && text[i + 1] === '*') || (text[i] === '_' && text[i + 1] === '_')) {
        // Save any accumulated text
        if (currentSegment) {
          segments.push({ text: currentSegment });
          currentSegment = '';
        }
        
        const marker = text.substring(i, i + 2);
        let j = i + 2;
        
        // Find closing marker
        while (j < text.length - 1) {
          if (text.substring(j, j + 2) === marker) {
            break;
          }
          j++;
        }
        
        if (j < text.length - 1 && text.substring(j, j + 2) === marker) {
          // Found closing marker
          const boldText = text.substring(i + 2, j);
          segments.push({ text: boldText, bold: true });
          i = j + 2;
          continue;
        }
      }
      
      // Check for italic (*text* or _text_)
      if ((text[i] === '*' && text[i + 1] !== '*') || (text[i] === '_' && text[i + 1] !== '_')) {
        // Save any accumulated text
        if (currentSegment) {
          segments.push({ text: currentSegment });
          currentSegment = '';
        }
        
        const marker = text[i];
        let j = i + 1;
        
        // Find closing marker
        while (j < text.length) {
          if (text[j] === marker && (j === text.length - 1 || text[j + 1] !== marker)) {
            break;
          }
          j++;
        }
        
        if (j < text.length && text[j] === marker) {
          // Found closing marker
          const italicText = text.substring(i + 1, j);
          segments.push({ text: italicText, italic: true });
          i = j + 1;
          continue;
        }
      }
      
      // Regular character
      currentSegment += text[i];
      i++;
    }
    
    // Add any remaining text
    if (currentSegment) {
      segments.push({ text: currentSegment });
    }

    // Render segments with word wrapping
    let currentX = startX;
    const lineHeight = 5;
    
    for (const segment of segments) {
      if (!segment.text) continue;
      
      // Apply formatting
      if (segment.link) {
        this.doc.setTextColor(0, 0, 255);
        this.doc.setFont(this.options.fontFamily, 'normal');
        this.doc.setFontSize(this.options.fontSize);
      } else if (segment.code) {
        this.doc.setFont('courier', 'normal');
        this.doc.setFontSize(this.options.fontSize - 1);
      } else if (segment.bold) {
        this.doc.setFont(this.options.fontFamily, 'bold');
        this.doc.setFontSize(this.options.fontSize);
      } else if (segment.italic) {
        this.doc.setFont(this.options.fontFamily, 'italic');
        this.doc.setFontSize(this.options.fontSize);
      } else {
        this.doc.setFont(this.options.fontFamily, 'normal');
        this.doc.setFontSize(this.options.fontSize);
      }

      // Split segment into words for wrapping
      const words = segment.text.split(/(\s+)/); // Keep whitespace
      
      for (const word of words) {
        if (!word) continue;
        
        const wordWidth = this.doc.getTextWidth(word);
        
        // Check if word fits on current line
        if (currentX + wordWidth > startX + maxWidth && currentX > startX && word.trim()) {
          // Move to next line
          this.currentY += lineHeight;
          this.checkPageBreak(lineHeight);
          currentX = startX;
        }
        
        // Render word with background for code
        if (segment.code && word.trim()) {
          const padding = 0.5;
          this.doc.setFillColor(245, 245, 245);
          this.doc.rect(
            currentX - padding,
            this.currentY - 3.5,
            wordWidth + padding * 2,
            4.5,
            'F'
          );
        }
        
        // Render as link or regular text
        if (segment.link && word.trim()) {
          this.doc.textWithLink(word, currentX, this.currentY, { url: segment.link.url });
        } else {
          this.doc.text(word, currentX, this.currentY);
        }
        
        currentX += wordWidth;
      }
      
      // Reset formatting
      this.doc.setFont(this.options.fontFamily, 'normal');
      this.doc.setFontSize(this.options.fontSize);
      this.doc.setTextColor(0, 0, 0);
    }
    
    // Move to next line after rendering all segments
    this.currentY += lineHeight;
  }

  /**
   * Render a blockquote
   */
  private renderBlockquote(text: string): void {
    if (!this.doc) return;

    // Strip inline markdown from blockquote
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
    text = text.replace(/__([^_]+)__/g, '$1');
    text = text.replace(/\*([^*]+)\*/g, '$1');
    text = text.replace(/_([^_]+)_/g, '$1');
    text = text.replace(/`([^`]+)`/g, '$1');
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');

    this.checkPageBreak(7);
    
    const quoteWidth = this.getContentWidth() - 10;
    this.doc.setFont(this.options.fontFamily, 'italic');
    
    const lines = this.doc.splitTextToSize(text, quoteWidth);
    for (const line of lines) {
      this.doc.text(line, this.options.margins.left + 10, this.currentY);
      this.currentY += 5;
    }
    
    this.doc.setFont(this.options.fontFamily, 'normal');
    this.currentY += 2;
  }

  /**
   * Render a paragraph with inline formatting (bold, italic, links, inline code)
   */
  private renderParagraph(text: string, contentWidth: number): void {
    if (!this.doc) return;

    // Use the formatted text renderer which now handles links
    this.renderFormattedText(text, this.options.margins.left, contentWidth);
  }

  private async renderCodeBlock(element: CodeBlockElement): Promise<void> {
    if (!this.doc) return;

    const contentWidth = this.getContentWidth();
    const codeStyle = this.options.codeBlockStyle;

    this.checkPageBreak(15);
    this.currentY += 3;

    if (element.language) {
      this.doc.setFontSize(9);
      this.doc.setFont(this.options.fontFamily, 'italic');
      this.doc.text(`Language: ${element.language}`, this.options.margins.left, this.currentY);
      this.currentY += 5;
      this.doc.setFontSize(this.options.fontSize);
      this.doc.setFont(this.options.fontFamily, 'normal');
    }

    this.doc.setFont(codeStyle.fontFamily);
    this.doc.setFontSize(codeStyle.fontSize);

    const sanitizedCode = this.sanitizeText(element.code);
    const codeLines = sanitizedCode.split('\n');
    const wrappedLines: string[] = [];

    for (const line of codeLines) {
      const wrapped = this.doc.splitTextToSize(line || ' ', contentWidth - 4);
      wrappedLines.push(...wrapped);
    }

    const lineHeight = 4;
    const totalHeight = wrappedLines.length * lineHeight + 4;

    if (this.currentY + totalHeight > this.pageHeight - this.options.margins.bottom) {
      this.doc.addPage();
      this.currentY = this.options.margins.top;
    }

    this.doc.setFillColor(245, 245, 245);
    this.doc.rect(
      this.options.margins.left,
      this.currentY - 2,
      contentWidth,
      totalHeight,
      'F'
    );

    this.currentY += 2;
    for (const line of wrappedLines) {
      this.doc.text(line, this.options.margins.left + 2, this.currentY);
      this.currentY += lineHeight;
    }

    this.currentY += 2;

    this.doc.setFont(this.options.fontFamily);
    this.doc.setFontSize(this.options.fontSize);

    this.currentY += 3;
  }

  private renderTable(element: TableElement): void {
    if (!this.doc) return;

    this.checkPageBreak(20);
    this.currentY += 3;

    autoTable(this.doc, {
      head: [element.headers],
      body: element.rows,
      startY: this.currentY,
      margin: { left: this.options.margins.left, right: this.options.margins.right },
      styles: {
        fontSize: 9,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      didDrawPage: (data) => {
        this.currentY = data.cursor?.y || this.currentY;
      }
    });

    const finalY = (this.doc as any).lastAutoTable?.finalY;
    if (finalY) {
      this.currentY = finalY;
    }

    this.currentY += 5;
  }

  private async renderImage(element: ImageElement): Promise<void> {
    if (!this.doc) return;

    try {
      this.checkPageBreak(30);
      this.currentY += 3;

      const imgData = await this.loadImage(element.src);

      const contentWidth = this.getContentWidth();
      const maxWidth = contentWidth;
      const maxHeight = 100;

      const img = new Image();
      
      const loadPromise = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        setTimeout(() => reject(new Error('Image load timeout')), 3000);
      });

      img.src = imgData;

      try {
        await loadPromise;
      } catch (error) {
        // Image load failed, use default dimensions
      }

      let width = img.width || 100;
      let height = img.height || 100;
      
      if (img.width > 0 && img.height > 0) {
        width = img.width * 0.264583;
        height = img.height * 0.264583;
      }

      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = height * ratio;
      }

      if (height > maxHeight) {
        const ratio = maxHeight / height;
        height = maxHeight;
        width = width * ratio;
      }

      if (this.currentY + height > this.pageHeight - this.options.margins.bottom) {
        this.doc.addPage();
        this.currentY = this.options.margins.top;
      }

      this.doc.addImage(
        imgData,
        'JPEG',
        this.options.margins.left,
        this.currentY,
        width,
        height
      );

      this.currentY += height;

      if (element.alt) {
        this.currentY += 3;
        this.doc.setFontSize(9);
        this.doc.setFont(this.options.fontFamily, 'italic');
        const altLines = this.doc.splitTextToSize(`Alt: ${element.alt}`, contentWidth);
        for (const line of altLines) {
          this.checkPageBreak(5);
          this.doc.text(line, this.options.margins.left, this.currentY);
          this.currentY += 4;
        }
        this.doc.setFontSize(this.options.fontSize);
        this.doc.setFont(this.options.fontFamily, 'normal');
      }

      this.currentY += 5;
    } catch (error) {
      // Image loading failed - render placeholder
      this.doc.setFontSize(9);
      this.doc.setFont(this.options.fontFamily, 'italic');
      this.doc.setTextColor(150, 150, 150);
      this.doc.text('[Image could not be loaded]', this.options.margins.left, this.currentY);
      
      if (element.alt) {
        this.currentY += 4;
        this.doc.text(`Alt: ${element.alt}`, this.options.margins.left, this.currentY);
      }
      
      this.currentY += 5;
      
      this.doc.setTextColor(0, 0, 0);
      this.doc.setFontSize(this.options.fontSize);
      this.doc.setFont(this.options.fontFamily, 'normal');
    }
  }

  private async loadImage(src: string): Promise<string> {
    if (src.startsWith('data:')) {
      return src;
    }

    try {
      const response = await fetch(src);
      const blob = await response.blob();
      
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw new Error(`Failed to fetch image from ${src}: ${error}`);
    }
  }

  private checkPageBreak(requiredSpace: number): void {
    if (!this.doc) return;

    if (this.currentY + requiredSpace > this.pageHeight - this.options.margins.bottom) {
      this.doc.addPage();
      this.currentY = this.options.margins.top;
    }
  }

  private getContentWidth(): number {
    return this.pageWidth - this.options.margins.left - this.options.margins.right;
  }

  /**
   * Sanitize text to remove characters not supported by jsPDF
   * Removes emojis and other Unicode characters that cause encoding issues
   */
  private sanitizeText(text: string): string {
    return text
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Emoticons, symbols, pictographs
      .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Miscellaneous symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
      .replace(/[\u{1F000}-\u{1F02F}]/gu, '') // Mahjong tiles
      .replace(/[\u{1F0A0}-\u{1F0FF}]/gu, '') // Playing cards
      .replace(/[\u{1F100}-\u{1F64F}]/gu, '') // Enclosed characters, emoticons
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and map symbols
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental symbols
      .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess symbols, extended pictographs
      .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols and pictographs extended-A
      .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation selectors
      .replace(/[\u{200D}]/gu, '')            // Zero-width joiner
      .trim();
  }
}
