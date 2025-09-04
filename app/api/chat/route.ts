import { NextRequest, NextResponse } from 'next/server';
import { analyzeQuery, generateResponse } from '@/lib/claude';
import { query } from '@/lib/db';
import { SQLBuilder } from '@/lib/sql-builder';
import { TableRow, SearchFilters } from '@/types/database';

export interface ChatRequest {
  message: string;
  sessionId?: string;
  corpCode?: string;
  language?: 'en' | 'ko';
}

export interface ChatResponse {
  success: boolean;
  response?: string;
  searchResults?: any[];
  analysis?: any;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    
    if (!body.message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Analyze the query with Claude
    const analysis = await analyzeQuery(body.message);
    
    // Build search filters from analysis
    const filters: SearchFilters = {
      corpCode: body.corpCode || '00126380', // Default to Samsung
      keywords: analysis.keywords,
      statementType: analysis.statementType,
      dateRange: analysis.dateRange,
      limit: 10, // Get more results for context
    };

    // Search the database
    const sqlBuilder = new SQLBuilder();
    const { query: sqlQuery, params } = sqlBuilder.buildSearchQuery(filters);
    const searchResults = await query<TableRow>(sqlQuery, params);
    
    // Generate response with Claude
    const response = await generateResponse(
      body.message,
      searchResults,
      body.language || analysis.language || 'en'
    );

    return NextResponse.json({
      success: true,
      response,
      searchResults: searchResults.slice(0, 5), // Return top 5 for display
      analysis,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process chat message',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}