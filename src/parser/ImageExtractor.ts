import { ImageElement, DOMSelectors } from '../types';

export class ImageExtractor {
  constructor(private selectors: DOMSelectors) {}

  /**
   * Extract all images from a message element
   */
  extractImages(messageElement: HTMLElement): ImageElement[] {
    const imageElements = messageElement.querySelectorAll(this.selectors.image);
    const images: ImageElement[] = [];

    imageElements.forEach((element) => {
      if (element instanceof HTMLElement) {
        const image = this.extractImageData(element);
        if (image) {
          images.push(image);
        }
      }
    });

    return images;
  }

  /**
   * Extract image data from an image element
   */
  private extractImageData(imageElement: HTMLElement): ImageElement | null {
    let src: string | null = null;
    let alt: string | undefined = undefined;

    if (imageElement.tagName === 'IMG') {
      const imgElement = imageElement as HTMLImageElement;
      src = imgElement.src || imgElement.getAttribute('data-src');
      alt = imgElement.alt;
      
      if (this.shouldSkipImage(imgElement, src)) {
        return null;
      }
    }
    else {
      src = imageElement.getAttribute('data-src') ||
            imageElement.getAttribute('data-image') ||
            imageElement.getAttribute('data-url');
      
      alt = imageElement.getAttribute('data-alt') ||
            imageElement.getAttribute('aria-label') ||
            imageElement.getAttribute('title') ||
            undefined;

      if (!src) {
        const backgroundImage = window.getComputedStyle(imageElement).backgroundImage;
        if (backgroundImage && backgroundImage !== 'none') {
          const urlMatch = backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
          if (urlMatch) {
            src = urlMatch[1];
          }
        }
      }

      if (!src) {
        const nestedImg = imageElement.querySelector('img');
        if (nestedImg) {
          src = nestedImg.src || nestedImg.getAttribute('data-src');
          alt = alt || nestedImg.alt;
        }
      }
    }

    if (!src) {
      return null;
    }

    src = this.normalizeSrc(src);
    if (!src) {
      return null;
    }

    return {
      type: 'image',
      src,
      alt: alt || undefined
    };
  }

  /**
   * Check if an image should be skipped (favicons, small UI icons, etc.)
   */
  private shouldSkipImage(imgElement: HTMLImageElement, src: string | null): boolean {
    if (!src) return true;
    
    if (src.includes('favicon') || src.includes('s2/favicons')) {
      return true;
    }
    
    if (imgElement.naturalWidth > 0 && imgElement.naturalHeight > 0) {
      if (imgElement.naturalWidth < 64 && imgElement.naturalHeight < 64) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Normalize and validate image src
   */
  private normalizeSrc(src: string): string | null {
    if (!src || src.trim() === '') {
      return null;
    }

    src = src.trim();

    if (src.startsWith('data:')) {
      if (this.isValidDataURI(src)) {
        return src;
      }
      return null;
    }

    if (src.startsWith('/') || src.startsWith('./') || src.startsWith('../')) {
      try {
        const absoluteUrl = new URL(src, window.location.href);
        return absoluteUrl.href;
      } catch (e) {
        return null;
      }
    }

    if (src.startsWith('http://') || src.startsWith('https://')) {
      try {
        new URL(src);
        return src;
      } catch (e) {
        return null;
      }
    }

    if (src.startsWith('//')) {
      return window.location.protocol + src;
    }

    try {
      const absoluteUrl = new URL(src, window.location.href);
      return absoluteUrl.href;
    } catch (e) {
      return null;
    }
  }

  /**
   * Validate data URI format
   */
  private isValidDataURI(dataUri: string): boolean {
    const dataUriPattern = /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9\-\+\.]+)?(;base64)?,(.+)$/;
    return dataUriPattern.test(dataUri);
  }
}
