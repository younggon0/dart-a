import { query } from '@/lib/db';
import { TableRow } from '@/types/database';

export interface ExtractedData {
  cashFlow: {
    netIncome: number | null;
    operatingCashFlow: number | null;
    period: string;
    source: string;
    pageNumber: number;
  } | null;
  incomeStatement: {
    revenue: number | null;
    operatingProfit: number | null;
    netIncome: number | null;
    period: string;
    source: string;
    pageNumber: number;
  } | null;
  balanceSheet: {
    totalAssets: number | null;
    totalLiabilities: number | null;
    totalEquity: number | null;
    period: string;
    source: string;
    pageNumber: number;
  } | null;
  rawTables: TableRow[];
}

export class DataExtractionAgent {
  private corpCode: string;

  constructor(corpCode: string) {
    this.corpCode = corpCode;
  }

  async extract(): Promise<ExtractedData> {
    console.log('DataExtractionAgent: Starting extraction for', this.corpCode);
    
    // Fetch all relevant financial tables
    const [cashFlowTables, incomeStatementTables, balanceSheetTables] = await Promise.all([
      this.fetchCashFlowTables(),
      this.fetchIncomeStatementTables(),
      this.fetchBalanceSheetTables(),
    ]);

    // Extract data from each type of statement
    const cashFlow = this.extractCashFlowData(cashFlowTables);
    const incomeStatement = this.extractIncomeStatementData(incomeStatementTables);
    const balanceSheet = this.extractBalanceSheetData(balanceSheetTables);

    // Combine all raw tables for reference
    const rawTables = [...cashFlowTables, ...incomeStatementTables, ...balanceSheetTables];

    return {
      cashFlow,
      incomeStatement,
      balanceSheet,
      rawTables,
    };
  }

  private async fetchCashFlowTables(): Promise<TableRow[]> {
    const sql = `
      SELECT *
      FROM tables
      WHERE corp_code = $1
        AND (
          metadata->>'table_title_en' ILIKE '%cash%flow%'
          OR metadata->>'table_title_ko' ILIKE '%현금%흐름%'
          OR data::text ILIKE '%영업활동%현금%'
          OR data::text ILIKE '%당기순이익%'
        )
      ORDER BY source_file DESC, page_number ASC
      LIMIT 10
    `;
    
    return await query<TableRow>(sql, [this.corpCode]);
  }

  private async fetchIncomeStatementTables(): Promise<TableRow[]> {
    const sql = `
      SELECT *
      FROM tables
      WHERE corp_code = $1
        AND (
          metadata->>'table_title_en' ILIKE '%income%statement%'
          OR metadata->>'table_title_ko' ILIKE '%손익%계산%'
          OR metadata->>'table_title_en' ILIKE '%comprehensive%income%'
          OR data::text ILIKE '%매출액%'
          OR data::text ILIKE '%영업이익%'
        )
      ORDER BY source_file DESC, page_number ASC
      LIMIT 10
    `;
    
    return await query<TableRow>(sql, [this.corpCode]);
  }

  private async fetchBalanceSheetTables(): Promise<TableRow[]> {
    const sql = `
      SELECT *
      FROM tables
      WHERE corp_code = $1
        AND (
          metadata->>'table_title_en' ILIKE '%balance%sheet%'
          OR metadata->>'table_title_en' ILIKE '%financial%position%'
          OR metadata->>'table_title_ko' ILIKE '%재무%상태%'
          OR data::text ILIKE '%자산총계%'
          OR data::text ILIKE '%부채총계%'
        )
      ORDER BY source_file DESC, page_number ASC
      LIMIT 10
    `;
    
    return await query<TableRow>(sql, [this.corpCode]);
  }

  private extractCashFlowData(tables: TableRow[]) {
    if (tables.length === 0) return null;

    for (const table of tables) {
      if (!table.data || !Array.isArray(table.data)) continue;

      let netIncome: number | null = null;
      let operatingCashFlow: number | null = null;

      // Search for key metrics in the table data
      for (const row of table.data as any[]) {
        if (!Array.isArray(row) || row.length < 2) continue;

        const label = String(row[0]).toLowerCase();
        const labelKo = row[0];

        // Look for net income (당기순이익)
        if (label.includes('net income') || labelKo?.includes('당기순이익')) {
          netIncome = this.parseNumber(row[row.length - 1]);
        }

        // Look for operating cash flow (영업활동으로 인한 현금흐름)
        if (label.includes('operating activities') || 
            label.includes('cash flows from operating') ||
            labelKo?.includes('영업활동') && labelKo?.includes('현금흐름')) {
          operatingCashFlow = this.parseNumber(row[row.length - 1]);
        }
      }

      if (netIncome !== null || operatingCashFlow !== null) {
        return {
          netIncome,
          operatingCashFlow,
          period: table.metadata?.period_end || 'Latest',
          source: table.source_file || 'Unknown',
          pageNumber: table.page_number || 0,
        };
      }
    }

    return null;
  }

  private extractIncomeStatementData(tables: TableRow[]) {
    if (tables.length === 0) return null;

    for (const table of tables) {
      if (!table.data || !Array.isArray(table.data)) continue;

      let revenue: number | null = null;
      let operatingProfit: number | null = null;
      let netIncome: number | null = null;

      for (const row of table.data as any[]) {
        if (!Array.isArray(row) || row.length < 2) continue;

        const label = String(row[0]).toLowerCase();
        const labelKo = row[0];

        // Look for revenue (매출액)
        if (label.includes('revenue') || label.includes('sales') || 
            labelKo?.includes('매출액') || labelKo?.includes('매출')) {
          revenue = this.parseNumber(row[row.length - 1]);
        }

        // Look for operating profit (영업이익)
        if (label.includes('operating profit') || label.includes('operating income') ||
            labelKo?.includes('영업이익')) {
          operatingProfit = this.parseNumber(row[row.length - 1]);
        }

        // Look for net income (당기순이익)
        if (label.includes('net income') || label.includes('net profit') ||
            labelKo?.includes('당기순이익')) {
          netIncome = this.parseNumber(row[row.length - 1]);
        }
      }

      if (revenue !== null || operatingProfit !== null || netIncome !== null) {
        return {
          revenue,
          operatingProfit,
          netIncome,
          period: table.metadata?.period_end || 'Latest',
          source: table.source_file || 'Unknown',
          pageNumber: table.page_number || 0,
        };
      }
    }

    return null;
  }

  private extractBalanceSheetData(tables: TableRow[]) {
    if (tables.length === 0) return null;

    for (const table of tables) {
      if (!table.data || !Array.isArray(table.data)) continue;

      let totalAssets: number | null = null;
      let totalLiabilities: number | null = null;
      let totalEquity: number | null = null;

      for (const row of table.data as any[]) {
        if (!Array.isArray(row) || row.length < 2) continue;

        const label = String(row[0]).toLowerCase();
        const labelKo = row[0];

        // Look for total assets (자산총계)
        if (label.includes('total assets') || labelKo?.includes('자산총계')) {
          totalAssets = this.parseNumber(row[row.length - 1]);
        }

        // Look for total liabilities (부채총계)
        if (label.includes('total liabilities') || labelKo?.includes('부채총계')) {
          totalLiabilities = this.parseNumber(row[row.length - 1]);
        }

        // Look for total equity (자본총계)
        if (label.includes('total equity') || label.includes('total shareholders') ||
            labelKo?.includes('자본총계')) {
          totalEquity = this.parseNumber(row[row.length - 1]);
        }
      }

      if (totalAssets !== null || totalLiabilities !== null || totalEquity !== null) {
        return {
          totalAssets,
          totalLiabilities,
          totalEquity,
          period: table.metadata?.period_end || 'Latest',
          source: table.source_file || 'Unknown',
          pageNumber: table.page_number || 0,
        };
      }
    }

    return null;
  }

  private parseNumber(value: any): number | null {
    if (value === null || value === undefined) return null;

    // Convert to string and clean
    let str = String(value);
    
    // Remove any non-numeric characters except -, ., and ()
    str = str.replace(/[^\d\-.,()]/g, '');
    
    // Handle parentheses as negative numbers
    if (str.includes('(') && str.includes(')')) {
      str = '-' + str.replace(/[()]/g, '');
    }
    
    // Remove commas
    str = str.replace(/,/g, '');
    
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
  }
}