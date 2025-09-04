import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { SQLBuilder } from '@/lib/sql-builder';
import { TableRow, SearchFilters } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const filters: SearchFilters = {
      corpCode: body.corpCode || '00126380', // Default to Samsung
      keywords: body.keywords,
      statementType: body.statementType,
      dateRange: body.dateRange,
      limit: body.limit || 5,
    };

    const sqlBuilder = new SQLBuilder();
    const { query: sqlQuery, params } = sqlBuilder.buildSearchQuery(filters);
    
    const results = await query<TableRow>(sqlQuery, params);
    
    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
      filters,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to search tables',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const corpCode = searchParams.get('corpCode') || '00126380';
    const limit = parseInt(searchParams.get('limit') || '5');

    const sqlBuilder = new SQLBuilder();
    const { query: sqlQuery, params } = sqlBuilder.buildSimpleQuery(corpCode, limit);
    
    const results = await query<TableRow>(sqlQuery, params);
    
    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch tables',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}