# Claude Chat Exporter

A Chrome browser extension that exports Claude AI chat conversations to beautifully formatted PDF and Markdown files.

## Features

### Export Formats
- **PDF Export**: Professional PDFs with proper formatting, syntax highlighting, and clickable links
- **Markdown Export**: Clean, editable Markdown files perfect for documentation and version control

### Content Preservation
- **Text Formatting**: Preserves bold, italic, inline code, headings, lists, and blockquotes
- **Code Blocks**: Syntax-highlighted code blocks with language detection and gray backgrounds
- **Tables**: Properly formatted tables with headers and data rows
- **Images**: Embedded images with alt text
- **Links**: Clickable hyperlinks in PDF, preserved markdown links in MD files

## Installation

### From Source

1. Clone this repository:
   ```bash
   git clone https://github.com/anurag-as/claude-chat-exporter.git
   cd claude-chat-exporter
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## Architecture & Limitations

### Current Approach: DOM-Based Extraction

This extension currently extracts chat conversations by parsing the DOM tree of Claude.ai's web interface. While functional, this approach has a significant limitation:

**Fragility**: If Claude.ai changes their HTML structure, CSS classes, or DOM hierarchy, the extension will break and require updates to the selectors in `src/config/domSelectors.ts`.

### Alternative Approaches (Will be implemented)

More robust alternatives that could make the extension resilient to UI changes:

1. **Claude API Integration** - Direct API access to conversation history (requires API key)
2. **Browser Storage Inspection** - Read from localStorage/IndexedDB where Claude stores data
3. **Network Request Interception** - Capture conversation data from API calls via service worker
4. **Clipboard/Selection API** - User-driven selection and extraction
5. **MutationObserver with Semantic Patterns** - Detect message patterns rather than specific selectors
6. **Hybrid Approach** - Multiple strategies with fallback mechanisms

Contributions exploring these alternatives are welcome!

## Development

### Build Commands

```bash
npm run build      # Production build (minified)
npm run dev        # Development build with watch mode
npm run test       # Run test suite
npm run test:watch # Run tests in watch mode
npm run package    # Create distribution zip
```
