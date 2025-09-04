import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Get actual financial statement tables (ones with revenue/profit data)
    const financialTables = await query(`
      SELECT 
        id,
        source_file,
        metadata->>'table_title_en' as title_en,
        metadata->>'table_title_ko' as title_ko,
        data
      FROM tables 
      WHERE corp_code = '00126380'
        AND (
          metadata->>'table_title_ko' ILIKE '%요약%재무%'
          OR metadata->>'table_title_en' ILIKE '%financial%'
          OR data::text ILIKE '%매출액%'
          OR data::text ILIKE '%영업이익%'
        )
      ORDER BY source_file DESC
      LIMIT 10
    `);
    
    // Process to find operating profit data
    const tablesWithOperatingProfit = [];
    
    for (const table of financialTables) {
      if (table.data && Array.isArray(table.data)) {
        // Look for rows containing operating profit
        const operatingProfitRow = table.data.find((row: any) => {
          if (Array.isArray(row)) {
            const firstCell = String(row[0] || '');
            return firstCell.includes('영업이익') || firstCell.includes('영업손익');
          }
          return false;
        });
        
        const revenueRow = table.data.find((row: any) => {
          if (Array.isArray(row)) {
            const firstCell = String(row[0] || '');
            return firstCell.includes('매출액') || firstCell.includes('매출');
          }
          return false;
        });
        
        if (operatingProfitRow || revenueRow) {
          tablesWithOperatingProfit.push({
            id: table.id,
            source_file: table.source_file,
            title_en: table.title_en,
            title_ko: table.title_ko,
            operating_profit_row: operatingProfitRow,
            revenue_row: revenueRow,
            headers: table.data[0] // First row usually contains headers
          });
        }
      }
    }
    
    return NextResponse.json({
      totalTables: financialTables.length,
      tablesWithData: tablesWithOperatingProfit,
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug info' },
      { status: 500 }
    );
  }
}