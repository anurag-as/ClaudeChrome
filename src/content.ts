/**
 * Content Script Entry Point
 * 
 * This is the main entry point for the Claude Chat Exporter extension.
 * It listens for messages from the popup and handles export requests.
 */

import { ExportCoordinator } from './export/ExportCoordinator';
import { ErrorHandler } from './utils/ErrorHandler';
import { DEFAULT_CLAUDE_SELECTORS } from './config/domSelectors';

let exportCoordinator: ExportCoordinator | null = null;

/**
 * Initialize the export coordinator
 */
function initializeExportCoordinator() {
  if (!exportCoordinator) {
    const errorHandler = new ErrorHandler();
    exportCoordinator = new ExportCoordinator(
      DEFAULT_CLAUDE_SELECTORS,
      null,
      errorHandler
    );
  }
  return exportCoordinator;
}

/**
 * Handle messages from the popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'exportPdf') {
    const coordinator = initializeExportCoordinator();
    coordinator.exportToPDF()
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'exportMarkdown') {
    const coordinator = initializeExportCoordinator();
    coordinator.exportToMarkdown()
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }
});
