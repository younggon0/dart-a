import { NextRequest, NextResponse } from 'next/server';
import { analyzeQuery, generateResponse } from '@/lib/claude';
import { smartSearch } from '@/lib/smart-search';
import { ContextBuilderWithSources } from '@/lib/context-builder-with-sources';
import { TableRow } from '@/types/database';
import { SourceReference } from '@/types/source';
import { getCacheStats } from '@/lib/cache/api-cache';
import { 
  addToSession, 
  buildContextWithHistory,
  needsContext 
} from '@/lib/session';

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
  sources?: SourceReference[];
  analysis?: {
    concept: string;
    language: 'en' | 'ko';
  };
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

    // Track session if provided
    if (body.sessionId) {
      // Add user message to session history
      addToSession(body.sessionId, 'user', body.message);
    }

    // Step 1: Analyze query with Claude
    const analysis = await analyzeQuery(body.message);
    console.log('Query analysis:', analysis);
    console.log('Needs context:', needsContext(body.message));
    
    // Step 2: Smart search for relevant tables
    const corpCode = body.corpCode || '00126380';
    const searchResults = await smartSearch(corpCode, body.message, 10);
    
    // Step 3: Handle no results gracefully
    if (searchResults.length === 0) {
      const noResultsMessage = getNoResultsMessage(
        body.message,
        analysis.concept,
        body.language || analysis.language
      );
      
      return NextResponse.json({
        success: true,
        response: noResultsMessage,
        searchResults: [],
        analysis,
      });
    }
    
    // Step 4: Build context from results with source tracking
    const contextBuilder = new ContextBuilderWithSources();
    const { context: initialContext, sources } = contextBuilder.buildContextWithSources(searchResults, body.message);
    
    // Add conversation history if this is a follow-up question
    let context = initialContext;
    if (body.sessionId && needsContext(body.message)) {
      context = buildContextWithHistory(context, body.sessionId, body.message);
      console.log('Added conversation history to context');
    }
    
    // Step 5: Generate response with Claude
    const response = await generateResponse(
      body.message,
      context,
      body.language || analysis.language
    );
    
    // Track assistant response in session
    if (body.sessionId) {
      addToSession(body.sessionId, 'assistant', response);
    }
    
    // Log cache statistics
    const cacheStats = getCacheStats();
    console.log('Cache Stats:', cacheStats);

    return NextResponse.json({
      success: true,
      response,
      searchResults: searchResults.slice(0, 5),
      sources: sources.slice(0, 5), // Return top 5 sources
      analysis,
      cacheStats, // Include cache stats in response
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process your request. Please try again.',
      },
      { status: 500 }
    );
  }
}

/**
 * Generate helpful message when no results found
 */
function getNoResultsMessage(
  query: string,
  concept: string,
  language: 'en' | 'ko'
): string {
  if (language === 'ko') {
    return `
"${query}"에 대한 검색 결과를 찾을 수 없습니다.

현재 데이터베이스에는 삼성전자의 재무제표 데이터가 저장되어 있습니다.
다음과 같은 정보를 조회할 수 있습니다:
• 매출액 및 성장률
• 영업이익 추이
• 현금흐름 현황
• 재무상태표 주요 항목
• 부채비율 및 자본구조

다른 질문을 시도해 보시거나, 위의 항목들에 대해 문의해 주세요.
    `.trim();
  }

  return `
No results found for: "${query}"

Our database currently contains Samsung Electronics financial data.
You can ask about:
• Revenue and growth rates
• Operating profit trends
• Cash flow statements
• Balance sheet items
• Debt ratios and capital structure

Please try rephrasing your question or ask about one of the topics above.
  `.trim();
}