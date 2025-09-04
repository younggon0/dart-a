import { NextRequest, NextResponse } from 'next/server';
import { analyzeQuery, generateResponse, QueryAnalysis } from '@/lib/claude';
import { query } from '@/lib/db';
import { SQLBuilder } from '@/lib/sql-builder';
import { TableRow, SearchFilters } from '@/types/database';
import { expandKeywords } from '@/lib/keyword-mapper';
import { ContextBuilder } from '@/lib/context-builder';

export interface ChatRequest {
  message: string;
  sessionId?: string;
  corpCode?: string;
  language?: 'en' | 'ko';
}

export interface ChatResponse {
  success: boolean;
  response?: string;
  searchResults?: TableRow[];
  analysis?: QueryAnalysis;
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
    
    // Handle keywords whether they come as array or object
    let keywordsArray: string[] = [];
    if (analysis.keywords) {
      if (Array.isArray(analysis.keywords)) {
        keywordsArray = analysis.keywords;
      } else if (typeof analysis.keywords === 'object') {
        // Flatten object values into array
        keywordsArray = Object.values(analysis.keywords).flat().filter((k): k is string => typeof k === 'string');
      }
    }
    
    // Expand keywords to include both English and Korean terms
    const expandedKeywords = expandKeywords(keywordsArray);
    
    // Build search filters from analysis
    const filters: SearchFilters = {
      corpCode: body.corpCode || '00126380', // Default to Samsung
      keywords: expandedKeywords,
      statementType: analysis.statementType,
      dateRange: analysis.dateRange,
      limit: 10, // Get more results for context
    };

    // Search the database
    const sqlBuilder = new SQLBuilder();
    const { query: sqlQuery, params } = sqlBuilder.buildSearchQuery(filters);
    const searchResults = await query<TableRow>(sqlQuery, params);
    
    // Build context from search results using actual data
    const contextBuilder = new ContextBuilder();
    const context = contextBuilder.buildContext(searchResults, body.message);
    
    // Generate response with Claude using the formatted context
    const response = await generateResponse(
      body.message,
      context,
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