import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Get sample of tables with operating profit data
    const profitTables = await query(`
      SELECT 
        id,
        source_file,
        page_number,
        metadata->>'table_title_en' as title_en,
        metadata->>'table_title_ko' as title_ko,
        metadata->>'statement_type' as type,
        metadata->>'period_end' as period,
        CASE 
          WHEN data::text ILIKE '%영업이익%' THEN true
          ELSE false
        END as has_operating_profit,
        CASE
          WHEN data::text ILIKE '%매출%' THEN true
          ELSE false
        END as has_revenue
      FROM tables 
      WHERE corp_code = '00126380'
      ORDER BY created_at DESC
      LIMIT 20
    `);
    
    // Get tables that likely contain operating profit
    const operatingProfitTables = await query(`
      SELECT 
        id,
        source_file,
        metadata->>'table_title_en' as title_en,
        metadata->>'table_title_ko' as title_ko,
        LEFT(data::text, 500) as data_preview
      FROM tables 
      WHERE corp_code = '00126380'
        AND data::text ILIKE '%영업이익%'
      LIMIT 5
    `);
    
    return NextResponse.json({
      totalTables: profitTables.length,
      tables: profitTables,
      operatingProfitTables: operatingProfitTables,
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug info' },
      { status: 500 }
    );
  }
}