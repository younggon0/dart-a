import { NextRequest, NextResponse } from 'next/server';
import { analyzeQuery, generateResponse, QueryAnalysis } from '@/lib/claude';
import { TableRow, SearchFilters } from '@/types/database';
import { expandKeywords } from '@/lib/keyword-mapper';
import { ContextBuilder } from '@/lib/context-builder';
import { enhanceKeywords, analyzeQueryIntent } from '@/lib/query-enhancer';
import { searchWithFallback } from '@/lib/search-strategy';
import { smartSearch } from '@/lib/smart-search';

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
    
    // Enhance keywords based on query patterns and intent
    const enhancedKeywords = enhanceKeywords(body.message, expandedKeywords);
    
    // Analyze query intent for better filtering
    const queryIntent = analyzeQueryIntent(body.message);
    
    // Build search filters from analysis
    const filters: SearchFilters = {
      corpCode: body.corpCode || '00126380', // Default to Samsung
      keywords: enhancedKeywords,
      statementType: analysis.statementType,
      dateRange: analysis.dateRange,
      limit: queryIntent.needsComparison ? 15 : 10, // Get more results if comparison needed
    };

    // First try smart search for financial queries
    let searchResults = await smartSearch(
      body.corpCode || '00126380',
      body.message,
      filters.limit || 10
    );
    
    let strategy = { description: 'Smart search for financial data' };
    
    // If smart search didn't find anything, fall back to keyword search
    if (searchResults.length === 0) {
      console.log('Smart search found no results, falling back to keyword search');
      const fallbackResult = await searchWithFallback(
        filters,
        body.message
      );
      searchResults = fallbackResult.results;
      strategy = fallbackResult.strategy;
    }
    
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
      searchStrategy: strategy.description, // Include strategy for debugging
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