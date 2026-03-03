/**
 * DownloadManager handles file downloads in the browser
 * Supports both Blob and string content types
 */
export class DownloadManager {
  /**
   * Downloads a file to the user's browser
   * @param content - The file content (Blob or string)
   * @param filename - The name for the downloaded file
   * @param mimeType - The MIME type of the file
   * @throws Error if download fails or is blocked by browser
   */
  downloadFile(content: Blob | string, filename: string, mimeType: string): void {
    try {
      const blob = content instanceof Blob 
        ? content 
        : new Blob([content], { type: mimeType });

      const url = URL.createObjectURL(blob);

      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.style.display = 'none';

      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generates a filename with timestamp
   * @param baseName - The base name for the file (e.g., 'chat-export')
   * @param extension - The file extension (e.g., 'pdf', 'md')
   * @returns Filename with timestamp (e.g., 'chat-export-20240115-143022.pdf')
   */
  generateFilename(baseName: string, extension: string): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    
    const timestamp = `${year}${month}${day}-${hours}${minutes}${seconds}`;
    return `${baseName}-${timestamp}.${extension}`;
  }
}
