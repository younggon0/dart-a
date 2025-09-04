import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Test 1: Find summary tables
    const summaryTables = await query(`
      SELECT 
        id,
        source_file,
        metadata->>'table_title_en' as title_en,
        metadata->>'table_title_ko' as title_ko
      FROM tables 
      WHERE corp_code = '00126380'
        AND (
          metadata->>'table_title_en' ILIKE '%summary%'
          OR metadata->>'table_title_ko' ILIKE '%요약%'
        )
      LIMIT 5
    `);
    
    // Test 2: Find tables with operating profit in data
    const operatingProfitInData = await query(`
      SELECT 
        id,
        source_file,
        metadata->>'table_title_en' as title_en,
        metadata->>'table_title_ko' as title_ko
      FROM tables 
      WHERE corp_code = '00126380'
        AND data::text ILIKE '%영업이익%'
      LIMIT 5
    `);
    
    // Test 3: Find segment or consolidated tables
    const segmentTables = await query(`
      SELECT 
        id,
        source_file,
        metadata->>'table_title_en' as title_en,
        metadata->>'table_title_ko' as title_ko
      FROM tables 
      WHERE corp_code = '00126380'
        AND (
          metadata->>'table_title_en' ILIKE '%segment%'
          OR metadata->>'table_title_ko' ILIKE '%부문%'
          OR metadata->>'table_title_en' ILIKE '%consolidated%'
          OR metadata->>'table_title_ko' ILIKE '%연결%'
        )
      LIMIT 5
    `);
    
    return NextResponse.json({
      summaryTables,
      operatingProfitInData,
      segmentTables,
    });
  } catch (error) {
    console.error('Test search error:', error);
    return NextResponse.json(
      { error: 'Failed to test search' },
      { status: 500 }
    );
  }
}