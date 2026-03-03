import { TableExtractor } from '../../src/parser/TableExtractor';
import { DOMSelectors } from '../../src/types';

describe('TableExtractor', () => {
  let extractor: TableExtractor;
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
    extractor = new TableExtractor(selectors);
  });

  describe('extractTables', () => {
    it('should extract HTML table with headers', () => {
      const messageElement = document.createElement('div');
      messageElement.innerHTML = `
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Alice</td>
              <td>30</td>
            </tr>
            <tr>
              <td>Bob</td>
              <td>25</td>
            </tr>
          </tbody>
        </table>
      `;

      const tables = extractor.extractTables(messageElement);

      expect(tables).toHaveLength(1);
      expect(tables[0].type).toBe('table');
      expect(tables[0].headers).toEqual(['Name', 'Age']);
      expect(tables[0].rows).toEqual([
        ['Alice', '30'],
        ['Bob', '25']
      ]);
    });

    it('should extract table without thead using th elements', () => {
      const messageElement = document.createElement('div');
      messageElement.innerHTML = `
        <table>
          <tr>
            <th>Product</th>
            <th>Price</th>
          </tr>
          <tr>
            <td>Apple</td>
            <td>$1</td>
          </tr>
        </table>
      `;

      const tables = extractor.extractTables(messageElement);

      expect(tables).toHaveLength(1);
      expect(tables[0].headers).toEqual(['Product', 'Price']);
      expect(tables[0].rows).toEqual([['Apple', '$1']]);
    });

    it('should create generic headers when none provided', () => {
      const messageElement = document.createElement('div');
      messageElement.innerHTML = `
        <table>
          <tr>
            <td>Data1</td>
            <td>Data2</td>
          </tr>
          <tr>
            <td>Data3</td>
            <td>Data4</td>
          </tr>
        </table>
      `;

      const tables = extractor.extractTables(messageElement);

      expect(tables).toHaveLength(1);
      expect(tables[0].headers).toEqual(['Column 1', 'Column 2']);
      expect(tables[0].rows).toEqual([
        ['Data1', 'Data2'],
        ['Data3', 'Data4']
      ]);
    });

    it('should extract multiple tables', () => {
      const messageElement = document.createElement('div');
      messageElement.innerHTML = `
        <table>
          <tr><th>A</th></tr>
          <tr><td>1</td></tr>
        </table>
        <table>
          <tr><th>B</th></tr>
          <tr><td>2</td></tr>
        </table>
      `;

      const tables = extractor.extractTables(messageElement);

      expect(tables).toHaveLength(2);
      expect(tables[0].headers).toEqual(['A']);
      expect(tables[1].headers).toEqual(['B']);
    });

    it('should return empty array when no tables found', () => {
      const messageElement = document.createElement('div');
      messageElement.innerHTML = '<p>No tables here</p>';

      const tables = extractor.extractTables(messageElement);

      expect(tables).toHaveLength(0);
    });

    it('should handle empty table', () => {
      const messageElement = document.createElement('div');
      messageElement.innerHTML = '<table></table>';

      const tables = extractor.extractTables(messageElement);

      expect(tables).toHaveLength(0);
    });
  });

  describe('parseTableStructure', () => {
    it('should parse standard HTML table', () => {
      const tableElement = document.createElement('table');
      tableElement.innerHTML = `
        <tr>
          <th>Header1</th>
          <th>Header2</th>
        </tr>
        <tr>
          <td>Value1</td>
          <td>Value2</td>
        </tr>
      `;

      const table = extractor.parseTableStructure(tableElement);

      expect(table).not.toBeNull();
      expect(table?.headers).toEqual(['Header1', 'Header2']);
      expect(table?.rows).toEqual([['Value1', 'Value2']]);
    });

    it('should handle tables with varying column counts', () => {
      const tableElement = document.createElement('table');
      tableElement.innerHTML = `
        <tr>
          <th>A</th>
          <th>B</th>
          <th>C</th>
        </tr>
        <tr>
          <td>1</td>
          <td>2</td>
        </tr>
        <tr>
          <td>3</td>
          <td>4</td>
          <td>5</td>
          <td>6</td>
        </tr>
      `;

      const table = extractor.parseTableStructure(tableElement);

      expect(table).not.toBeNull();
      expect(table?.headers).toEqual(['A', 'B', 'C']);
      expect(table?.rows).toEqual([
        ['1', '2'],
        ['3', '4', '5', '6']
      ]);
    });
  });
});
