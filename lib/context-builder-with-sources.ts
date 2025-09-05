import { TableRow } from '@/types/database';
import { SourceReference, DataPoint } from '@/types/source';

export interface ContextWithSources {
  context: string;
  sources: SourceReference[];
}

export class ContextBuilderWithSources {
  /**
   * Build context and track sources
   */
  buildContextWithSources(tables: TableRow[], query: string): ContextWithSources {
    if (!tables || tables.length === 0) {
      return {
        context: 'No search results found.',
        sources: []
      };
    }

    const contextParts = [`User Query: ${query}\n`];
    const sources: SourceReference[] = [];

    tables.forEach((table, index) => {
      const tableContext = this.formatTableContext(table, index + 1);
      contextParts.push(tableContext);

      // Create source reference
      const source = this.createSourceReference(table, index + 1);
      if (source) {
        sources.push(source);
      }
    });

    return {
      context: contextParts.join('\n\n---\n\n'),
      sources
    };
  }

  /**
   * Create a source reference from a table
   */
  private createSourceReference(table: TableRow, index: number): SourceReference {
    const metadata = table.metadata || {};
    
    // Extract key data points if we have operating profit or revenue data
    const dataPoints = this.extractKeyDataPoints(table);

    return {
      id: `source-${table.id || index}`,
      tableId: table.id,
      tableName: metadata.table_title_en || '',
      tableNameKo: metadata.table_title_ko,
      sourceFile: table.source_file || '',
      pageNumber: table.page_number || 0,
      period: this.formatPeriod(metadata.period_start, metadata.period_end),
      confidence: metadata.confidence || 0.5,
      statementType: metadata.statement_type,
      dataPoints,
      relevanceScore: metadata.relevance_score as number | undefined,
      tableData: Array.isArray(table.data) ? table.data : undefined
    };
  }

  /**
   * Extract key data points from table data
   */
  private extractKeyDataPoints(table: TableRow): DataPoint[] {
    const dataPoints: DataPoint[] = [];
    
    if (!table.data || !Array.isArray(table.data)) {
      return dataPoints;
    }

    // Look for key financial metrics in the data
    const keyMetrics = ['영업이익', '매출액', '당기순이익', '자산', '부채', 'revenue', 'profit'];
    
    table.data.forEach((row: unknown, rowIndex: number) => {
      if (Array.isArray(row) && row.length > 0) {
        const firstCell = String(row[0] || '').toLowerCase();
        
        // Check if this row contains a key metric
        if (keyMetrics.some(metric => firstCell.includes(metric.toLowerCase()))) {
          // Add the most recent value (usually last column)
          if (row.length > 1) {
            dataPoints.push({
              field: row[0],
              value: this.formatValue(row[row.length - 1]),
              originalValue: String(row[row.length - 1]),
              row: rowIndex,
              column: row.length - 1
            });
          }
        }
      }
    });

    return dataPoints;
  }

  /**
   * Format a value for display
   */
  private formatValue(value: unknown): string {
    if (typeof value === 'number') {
      // Format large numbers
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}T KRW`;
      }
      return value.toLocaleString();
    }
    return String(value);
  }

  /**
   * Format period string
   */
  private formatPeriod(start?: string, end?: string): string {
    if (start && end) {
      return `${start} ~ ${end}`;
    } else if (end) {
      return end;
    } else if (start) {
      return start;
    }
    return '';
  }

  /**
   * Format a single table for context (original method kept for compatibility)
   */
  private formatTableContext(table: TableRow, index: number): string {
    const metadata = table.metadata || {};
    
    let context = `Table ${index}: ${metadata.table_title_en || metadata.table_title_ko || 'Untitled'}
Source: ${table.source_file || 'N/A'} (Page ${table.page_number || 'N/A'})
Period: ${metadata.period_start || 'N/A'} ~ ${metadata.period_end || 'N/A'}
Type: ${metadata.statement_type || 'N/A'} - ${metadata.specific_statement || 'N/A'}
Key Metrics: ${Array.isArray(metadata.key_metrics) ? metadata.key_metrics.join(', ') : 'N/A'}
Confidence: ${metadata.confidence || 'N/A'}

Table Data:
${this.formatTableData(table.data)}`;

    if (table.text_before) {
      context += `\n\nContext Before: ${table.text_before.trim()}`;
    }

    if (table.text_after) {
      context += `\n\nContext After: ${table.text_after.trim()}`;
    }

    return context.trim();
  }

  /**
   * Format table data as TSV
   */
  private formatTableData(data: Record<string, unknown> | unknown[][] | null | unknown): string {
    if (!data) {
      return 'No data available';
    }

    if (Array.isArray(data)) {
      return data
        .map(row => {
          if (Array.isArray(row)) {
            return row.join('\t');
          }
          return String(row);
        })
        .join('\n');
    }

    if (typeof data === 'object') {
      return Object.entries(data)
        .map(([key, value]) => `${key}\t${value}`)
        .join('\n');
    }

    return String(data);
  }
}