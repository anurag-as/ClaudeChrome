import { CodeBlockElement, DOMSelectors } from '../types';

export class CodeBlockExtractor {
  constructor(private selectors: DOMSelectors) {}

  /**
   * Extract all code blocks from a message element
   */
  extractCodeBlocks(messageElement: HTMLElement, externalSeenCodeContent?: Set<string>): CodeBlockElement[] {
    const codeBlockElements = messageElement.querySelectorAll(this.selectors.codeBlock);
    const codeBlocks: CodeBlockElement[] = [];
    const processedElements = new Set<HTMLElement>();
    const seenCodeContent = externalSeenCodeContent || new Set<string>();

    codeBlockElements.forEach((element) => {
      if (element instanceof HTMLElement) {
        // Skip if this element is inside a <pre> that we've already processed
        const parentPre = element.closest('pre');
        if (parentPre && parentPre !== element && processedElements.has(parentPre)) {
          return;
        }

        // If this is a <code> inside a <pre>, skip it (we'll process the <pre> instead)
        if (element.tagName.toLowerCase() === 'code' && element.closest('pre')) {
          return;
        }

        // Mark this element as processed
        processedElements.add(element);

        const language = this.detectLanguage(element);
        const code = this.extractCode(element);

        // Create a normalized version for deduplication
        const normalized = code
          .toLowerCase()
          .replace(/\/\/.*$/gm, '') // Remove single-line comments
          .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
          .replace(/#.*$/gm, '') // Remove Python comments
          .replace(/"""[\s\S]*?"""/g, '') // Remove Python docstrings
          .replace(/\s+/g, ' ') // Collapse whitespace
          .trim();

        // Only apply similarity detection for code blocks longer than 100 characters
        if (code.length > 100) {
          // Check if we've seen similar code (80% similarity threshold)
          let isDuplicate = false;
          for (const seenCode of seenCodeContent) {
            const similarity = this.calculateSimilarity(normalized, seenCode);
            if (similarity > 0.8) {
              isDuplicate = true;
              break;
            }
          }

          if (isDuplicate) {
            return;
          }

          seenCodeContent.add(normalized);
        } else {
          // For short code blocks, use exact match deduplication
          if (seenCodeContent.has(normalized)) {
            return;
          }
          seenCodeContent.add(normalized);
        }

        codeBlocks.push({
          type: 'code',
          language,
          code
        });
      }
    });

    return codeBlocks;
  }
  
  /**
   * Calculate similarity between two strings (0-1, where 1 is identical)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }
  
  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Detect the programming language of a code block
   */
  detectLanguage(codeElement: HTMLElement): string {
    // First, check for language in child elements (e.g., <code class="language-python">)
    const languageElement = codeElement.querySelector(this.selectors.codeLanguage);
    if (languageElement) {
      const classList = Array.from(languageElement.classList);
      for (const className of classList) {
        const langMatch = className.match(/^(?:language-|lang-)(.+)$/);
        if (langMatch && this.isValidLanguage(langMatch[1])) {
          return this.normalizeLanguage(langMatch[1]);
        }
      }
    }

    // Check data attributes
    const dataLang = codeElement.getAttribute('data-language') ||
                     codeElement.getAttribute('data-lang');
    if (dataLang) {
      return this.normalizeLanguage(dataLang);
    }

    // Check element's own classes
    const classList = Array.from(codeElement.classList);
    for (const className of classList) {
      const langMatch = className.match(/^(?:language-|lang-)?(.+)$/);
      if (langMatch && this.isValidLanguage(langMatch[1])) {
        return this.normalizeLanguage(langMatch[1]);
      }
    }

    // Check parent element's classes
    const parent = codeElement.parentElement;
    if (parent) {
      const parentClassList = Array.from(parent.classList);
      for (const className of parentClassList) {
        const langMatch = className.match(/^(?:language-|lang-)?(.+)$/);
        if (langMatch && this.isValidLanguage(langMatch[1])) {
          return this.normalizeLanguage(langMatch[1]);
        }
      }
    }

    return 'text';
  }

  /**
   * Extract code content from a code block element
   */
  private extractCode(codeElement: HTMLElement): string {
    // If this is a <pre> element, look for <code> children
    if (codeElement.tagName.toLowerCase() === 'pre') {
      const codeChildren = codeElement.querySelectorAll('code');
      
      // If there are multiple <code> elements, only take the first one
      if (codeChildren.length > 0) {
        const firstCode = codeChildren[0] as HTMLElement;
        let code = firstCode.textContent || '';
        return code.replace(/^\n+/, '').replace(/\n+$/, '');
      }
    }
    
    // Fallback: use the element itself
    const codeTag = codeElement.querySelector('code') || codeElement;
    let code = codeTag.textContent || '';
    return code.replace(/^\n+/, '').replace(/\n+$/, '');
  }

  /**
   * Normalize language names to common identifiers
   */
  private normalizeLanguage(lang: string): string {
    const normalized = lang.toLowerCase().trim();
    
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'py': 'python',
      'rb': 'ruby',
      'sh': 'bash',
      'shell': 'bash',
      'yml': 'yaml',
      'md': 'markdown',
      'c++': 'cpp',
      'c#': 'csharp',
      'cs': 'csharp',
      'objective-c': 'objectivec',
      'objc': 'objectivec'
    };

    return languageMap[normalized] || normalized;
  }

  /**
   * Check if a string is a valid programming language identifier
   */
  private isValidLanguage(lang: string): boolean {
    const normalized = lang.toLowerCase().trim();
    
    const validLanguages = [
      'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'csharp',
      'ruby', 'go', 'rust', 'php', 'swift', 'kotlin', 'scala', 'r',
      'perl', 'lua', 'haskell', 'elixir', 'clojure', 'dart', 'julia',
      'bash', 'shell', 'powershell', 'sql', 'html', 'css', 'scss', 'sass',
      'json', 'xml', 'yaml', 'toml', 'markdown', 'text', 'plaintext',
      'jsx', 'tsx', 'vue', 'svelte', 'graphql', 'dockerfile', 'makefile',
      'js', 'ts', 'py', 'rb', 'sh', 'yml', 'md'
    ];

    return validLanguages.includes(normalized);
  }
}
