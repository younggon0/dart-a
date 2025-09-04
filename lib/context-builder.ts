import { TableRow } from '@/types/database';

export class ContextBuilder {
  /**
   * Build context from retrieved tables for LLM
   */
  buildContext(tables: TableRow[], query: string): string {
    if (!tables || tables.length === 0) {
      return 'No search results found.';
    }

    const contextParts = [`User Query: ${query}\n`];

    tables.forEach((table, index) => {
      const tableContext = this.formatTableContext(table, index + 1);
      contextParts.push(tableContext);
    });

    return contextParts.join('\n\n---\n\n');
  }

  /**
   * Format a single table for context
   */
  private formatTableContext(table: TableRow, index: number): string {
    const metadata = table.metadata || {};
    
    // Build context with table information
    let context = `Table ${index}: ${metadata.table_title_en || metadata.table_title_ko || 'Untitled'}
Source: ${table.source_file || 'N/A'} (Page ${table.page_number || 'N/A'})
Period: ${metadata.period_start || 'N/A'} ~ ${metadata.period_end || 'N/A'}
Type: ${metadata.statement_type || 'N/A'} - ${metadata.specific_statement || 'N/A'}
Key Metrics: ${Array.isArray(metadata.key_metrics) ? metadata.key_metrics.join(', ') : 'N/A'}
Confidence: ${metadata.confidence || 'N/A'}

Table Data:
${this.formatTableData(table.data)}`;

    // Add surrounding context if available
    if (table.text_before) {
      context += `\n\nContext Before: ${table.text_before.trim()}`;
    }

    if (table.text_after) {
      context += `\n\nContext After: ${table.text_after.trim()}`;
    }

    return context.trim();
  }

  /**
   * Format table data as TSV to save tokens
   */
  private formatTableData(data: Record<string, unknown> | unknown[][] | null | unknown): string {
    if (!data) {
      return 'No data available';
    }

    // Handle different data formats
    if (Array.isArray(data)) {
      // Format as TSV (tab-separated values)
      return data.map(row => {
        if (Array.isArray(row)) {
          return row.map(cell => this.formatCell(cell)).join('\t');
        } else if (typeof row === 'object' && row !== null) {
          return Object.values(row).map(cell => this.formatCell(cell)).join('\t');
        } else {
          return String(row);
        }
      }).join('\n');
    } else if (typeof data === 'object') {
      // Format object data as key-value pairs
      return Object.entries(data)
        .map(([key, value]) => `${key}:\t${this.formatCell(value)}`)
        .join('\n');
    } else {
      return String(data);
    }
  }

  /**
   * Format individual cell value
   */
  private formatCell(cell: unknown): string {
    if (cell === null || cell === undefined) {
      return '';
    }
    if (typeof cell === 'string') {
      // Remove extra whitespace and newlines
      return cell.replace(/\s+/g, ' ').trim();
    }
    if (typeof cell === 'number') {
      // Format numbers with appropriate precision
      if (Number.isInteger(cell)) {
        return cell.toLocaleString();
      } else {
        return cell.toLocaleString(undefined, { maximumFractionDigits: 2 });
      }
    }
    if (typeof cell === 'object') {
      return JSON.stringify(cell);
    }
    return String(cell);
  }

  /**
   * Format results for display in UI (not for LLM)
   */
  formatForDisplay(tables: TableRow[]): Array<{
    title: string;
    period: string;
    type: string;
    confidence: number;
    hasData: boolean;
    rowCount: number;
  }> {
    return tables.map(table => ({
      title: table.metadata?.table_title_en || table.metadata?.table_title_ko || 'Untitled',
      period: table.metadata?.period_end ? new Date(table.metadata.period_end).toLocaleDateString() : 'N/A',
      type: table.metadata?.statement_type || 'Unknown',
      confidence: table.metadata?.confidence || 0,
      hasData: !!table.data,
      rowCount: Array.isArray(table.data) ? table.data.length : 0,
    }));
  }
}