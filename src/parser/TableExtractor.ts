import { TableElement, DOMSelectors } from '../types';

export class TableExtractor {
  constructor(private selectors: DOMSelectors) {}

  /**
   * Extract all tables from a message element
   */
  extractTables(messageElement: HTMLElement): TableElement[] {
    const tableElements = messageElement.querySelectorAll(this.selectors.table);
    const tables: TableElement[] = [];

    tableElements.forEach((element) => {
      if (element instanceof HTMLElement) {
        const table = this.parseTableStructure(element);
        if (table) {
          tables.push(table);
        }
      }
    });

    return tables;
  }

  /**
   * Parse the structure of a table element
   */
  parseTableStructure(tableElement: HTMLElement): TableElement | null {
    if (tableElement.tagName === 'TABLE') {
      return this.parseHTMLTable(tableElement);
    }

    return this.parseCustomTable(tableElement);
  }

  /**
   * Parse a standard HTML table element
   */
  private parseHTMLTable(tableElement: HTMLElement): TableElement | null {
    const headers: string[] = [];
    const rows: string[][] = [];
    let skipFirstDataRow = false;

    const thead = tableElement.querySelector('thead');
    
    if (thead) {
      const headerRow = thead.querySelector('tr');
      if (headerRow) {
        const headerCells = headerRow.querySelectorAll('th, td');
        headerCells.forEach((cell) => {
          headers.push(cell.textContent?.trim() || '');
        });
      }
    } else {
      const firstRow = tableElement.querySelector('tr');
      if (firstRow) {
        const firstRowCells = firstRow.querySelectorAll('th');
        if (firstRowCells.length > 0) {
          firstRowCells.forEach((cell) => {
            headers.push(cell.textContent?.trim() || '');
          });
          skipFirstDataRow = true;
        }
      }
    }

    const tbody = tableElement.querySelector('tbody');
    const rowElements = tbody 
      ? tbody.querySelectorAll('tr')
      : tableElement.querySelectorAll('tr');

    rowElements.forEach((rowElement, index) => {
      if (index === 0 && skipFirstDataRow) {
        return;
      }

      const cells = rowElement.querySelectorAll('td, th');
      const rowData: string[] = [];
      
      cells.forEach((cell) => {
        rowData.push(cell.textContent?.trim() || '');
      });

      if (rowData.length > 0) {
        rows.push(rowData);
      }
    });

    if (headers.length === 0 && rows.length > 0) {
      const columnCount = Math.max(...rows.map(row => row.length));
      for (let i = 0; i < columnCount; i++) {
        headers.push(`Column ${i + 1}`);
      }
    }

    if (headers.length === 0 && rows.length === 0) {
      return null;
    }

    return {
      type: 'table',
      headers,
      rows
    };
  }

  /**
   * Parse a custom table structure (e.g., div-based tables)
   */
  private parseCustomTable(tableElement: HTMLElement): TableElement | null {
    const headers: string[] = [];
    const rows: string[][] = [];

    const headerRow = tableElement.querySelector('[role="row"]:first-child, .table-header, .header-row');
    if (headerRow) {
      const headerCells = headerRow.querySelectorAll('[role="columnheader"], [role="cell"], .cell, .column');
      headerCells.forEach((cell) => {
        headers.push(cell.textContent?.trim() || '');
      });
    }

    const rowElements = tableElement.querySelectorAll('[role="row"], .table-row, .row');
    
    rowElements.forEach((rowElement, index) => {
      if (index === 0 && headers.length > 0) {
        return;
      }

      const cells = rowElement.querySelectorAll('[role="cell"], .cell, .column');
      const rowData: string[] = [];
      
      cells.forEach((cell) => {
        rowData.push(cell.textContent?.trim() || '');
      });

      if (rowData.length > 0) {
        rows.push(rowData);
      }
    });

    if (rows.length === 0) {
      const allCells = tableElement.querySelectorAll('.cell, [role="cell"]');
      if (allCells.length > 0) {
        const columnCount = headers.length || this.inferColumnCount(tableElement);
        
        let currentRow: string[] = [];
        allCells.forEach((cell, index) => {
          currentRow.push(cell.textContent?.trim() || '');
          
          if ((index + 1) % columnCount === 0) {
            rows.push(currentRow);
            currentRow = [];
          }
        });
        
        if (currentRow.length > 0) {
          rows.push(currentRow);
        }
      }
    }

    if (headers.length === 0 && rows.length > 0) {
      const columnCount = Math.max(...rows.map(row => row.length));
      for (let i = 0; i < columnCount; i++) {
        headers.push(`Column ${i + 1}`);
      }
    }

    if (headers.length === 0 && rows.length === 0) {
      return null;
    }

    return {
      type: 'table',
      headers,
      rows
    };
  }

  /**
   * Infer the number of columns in a custom table
   */
  private inferColumnCount(tableElement: HTMLElement): number {
    const gridTemplateColumns = window.getComputedStyle(tableElement).gridTemplateColumns;
    if (gridTemplateColumns && gridTemplateColumns !== 'none') {
      const columns = gridTemplateColumns.split(' ').length;
      if (columns > 0) {
        return columns;
      }
    }

    return 2;
  }
}
