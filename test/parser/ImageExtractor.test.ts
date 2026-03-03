import { ImageExtractor } from '../../src/parser/ImageExtractor';
import { DOMSelectors } from '../../src/types';

// Mock window.location for URL tests
delete (window as any).location;
(window as any).location = {
  href: 'https://example.com/chat',
  protocol: 'https:',
  hostname: 'example.com'
};

describe('ImageExtractor', () => {
  let extractor: ImageExtractor;
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
    extractor = new ImageExtractor(selectors);
  });

  describe('extractImages', () => {
    it('should extract image with src and alt', () => {
      const messageElement = document.createElement('div');
      const img = document.createElement('img');
      img.src = 'https://example.com/image.png';
      img.alt = 'Test image';
      messageElement.appendChild(img);

      const images = extractor.extractImages(messageElement);

      expect(images).toHaveLength(1);
      expect(images[0].type).toBe('image');
      expect(images[0].src).toBe('https://example.com/image.png');
      expect(images[0].alt).toBe('Test image');
    });

    it('should extract image without alt text', () => {
      const messageElement = document.createElement('div');
      const img = document.createElement('img');
      img.src = 'https://example.com/image.png';
      messageElement.appendChild(img);

      const images = extractor.extractImages(messageElement);

      expect(images).toHaveLength(1);
      expect(images[0].src).toBe('https://example.com/image.png');
      expect(images[0].alt).toBeUndefined();
    });

    it('should extract multiple images', () => {
      const messageElement = document.createElement('div');
      const img1 = document.createElement('img');
      img1.src = 'https://example.com/image1.png';
      const img2 = document.createElement('img');
      img2.src = 'https://example.com/image2.png';
      messageElement.appendChild(img1);
      messageElement.appendChild(img2);

      const images = extractor.extractImages(messageElement);

      expect(images).toHaveLength(2);
      expect(images[0].src).toBe('https://example.com/image1.png');
      expect(images[1].src).toBe('https://example.com/image2.png');
    });

    it('should handle data URI images', () => {
      const messageElement = document.createElement('div');
      const img = document.createElement('img');
      img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      img.alt = 'Data URI image';
      messageElement.appendChild(img);

      const images = extractor.extractImages(messageElement);

      expect(images).toHaveLength(1);
      expect(images[0].src).toContain('data:image/png;base64');
      expect(images[0].alt).toBe('Data URI image');
    });

    it('should return empty array when no images found', () => {
      const messageElement = document.createElement('div');
      messageElement.innerHTML = '<p>No images here</p>';

      const images = extractor.extractImages(messageElement);

      expect(images).toHaveLength(0);
    });

    it('should skip images with invalid src', () => {
      const messageElement = document.createElement('div');
      const img = document.createElement('img');
      // No src attribute
      messageElement.appendChild(img);

      const images = extractor.extractImages(messageElement);

      expect(images).toHaveLength(0);
    });

    it('should extract image from data-src attribute', () => {
      const messageElement = document.createElement('div');
      const img = document.createElement('img');
      img.setAttribute('data-src', 'https://example.com/lazy-image.png');
      messageElement.appendChild(img);

      const images = extractor.extractImages(messageElement);

      expect(images).toHaveLength(1);
      expect(images[0].src).toBe('https://example.com/lazy-image.png');
    });

    it('should convert relative URLs to absolute', () => {
      const messageElement = document.createElement('div');
      const img = document.createElement('img');
      img.src = '/images/test.png';
      messageElement.appendChild(img);

      const images = extractor.extractImages(messageElement);

      expect(images).toHaveLength(1);
      // In jsdom, the URL will be based on the test environment's location
      expect(images[0].src).toContain('/images/test.png');
      expect(images[0].src).toMatch(/^https?:\/\//);
    });

    it('should handle protocol-relative URLs', () => {
      const messageElement = document.createElement('div');
      const img = document.createElement('img');
      img.src = '//cdn.example.com/image.png';
      messageElement.appendChild(img);

      const images = extractor.extractImages(messageElement);

      expect(images).toHaveLength(1);
      // Protocol should be added based on current page protocol
      expect(images[0].src).toMatch(/^https?:\/\/cdn\.example\.com\/image\.png$/);
    });

    it('should reject invalid data URIs', () => {
      const messageElement = document.createElement('div');
      const img = document.createElement('img');
      img.src = 'data:invalid';
      messageElement.appendChild(img);

      const images = extractor.extractImages(messageElement);

      expect(images).toHaveLength(0);
    });
  });
});
