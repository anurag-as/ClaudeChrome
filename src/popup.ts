/**
 * Popup Script
 * Handles the extension popup UI and communicates with the content script
 */

const pdfButton = document.getElementById('exportPdf') as HTMLButtonElement;
const markdownButton = document.getElementById('exportMarkdown') as HTMLButtonElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;

function showStatus(message: string, type: 'loading' | 'success' | 'error') {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';
}

function hideStatus() {
  statusDiv.style.display = 'none';
}

function disableButtons() {
  pdfButton.disabled = true;
  markdownButton.disabled = true;
}

function enableButtons() {
  pdfButton.disabled = false;
  markdownButton.disabled = false;
}

async function exportChat(format: 'pdf' | 'markdown') {
  try {
    disableButtons();
    hideStatus();
    showStatus(`Exporting as ${format.toUpperCase()}...`, 'loading');

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.id) {
      throw new Error('No active tab found');
    }

    if (!tab.url?.includes('claude.ai')) {
      throw new Error('Please open a Claude.ai chat page');
    }

    const response = await chrome.tabs.sendMessage(tab.id, {
      action: format === 'pdf' ? 'exportPdf' : 'exportMarkdown'
    });

    if (response.success) {
      showStatus(`${format.toUpperCase()} exported successfully!`, 'success');
      setTimeout(() => {
        hideStatus();
        enableButtons();
      }, 2000);
    } else {
      throw new Error(response.error || 'Export failed');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Export failed';
    showStatus(message, 'error');
    enableButtons();
  }
}

pdfButton.addEventListener('click', () => exportChat('pdf'));
markdownButton.addEventListener('click', () => exportChat('markdown'));
