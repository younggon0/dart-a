/**
 * Smart search strategy that progressively broadens search if no results found
 */

import { query } from '@/lib/db';
import { SQLBuilder } from '@/lib/sql-builder';
import { TableRow, SearchFilters } from '@/types/database';

export interface SearchStrategy {
  level: 'specific' | 'broad' | 'fallback';
  keywords: string[];
  description: string;
}

/**
 * Generate search strategies from most specific to broadest
 */
export function generateSearchStrategies(
  originalKeywords: string[],
  queryIntent: string
): SearchStrategy[] {
  const strategies: SearchStrategy[] = [];
  
  // Level 1: Use all generated keywords (most specific)
  strategies.push({
    level: 'specific',
    keywords: originalKeywords,
    description: 'Full keyword search'
  });
  
  // Level 2: Use only the most important keywords
  const coreKeywords = extractCoreKeywords(originalKeywords, queryIntent);
  if (coreKeywords.length > 0 && coreKeywords.length < originalKeywords.length) {
    strategies.push({
      level: 'broad',
      keywords: coreKeywords,
      description: 'Core terms only'
    });
  }
  
  // Level 3: Use very generic terms based on intent
  const fallbackKeywords = getFallbackKeywords(queryIntent);
  strategies.push({
    level: 'fallback',
    keywords: fallbackKeywords,
    description: 'Generic financial terms'
  });
  
  return strategies;
}

/**
 * Extract only the most important keywords
 */
function extractCoreKeywords(keywords: string[], intent: string): string[] {
  const core = new Set<string>();
  
  // Prioritize Korean terms and key English terms
  for (const keyword of keywords) {
    // Keep Korean terms
    if (/[가-힣]/.test(keyword)) {
      core.add(keyword);
    }
    // Keep key English terms (single words, not phrases)
    else if (keyword.split(' ').length === 1 && keyword.length > 3) {
      const lower = keyword.toLowerCase();
      if (['profit', 'revenue', 'sales', 'income', 'cash', 'asset', 'operating'].includes(lower)) {
        core.add(keyword);
      }
    }
  }
  
  // If we have too few core keywords, add some back
  if (core.size < 3 && keywords.length > 0) {
    // Add the first few keywords
    keywords.slice(0, 3).forEach(k => core.add(k));
  }
  
  return Array.from(core);
}

/**
 * Get very broad fallback keywords based on query intent
 */
function getFallbackKeywords(intent: string): string[] {
  const intentLower = intent.toLowerCase();
  
  // For any financial query, prioritize finding summary/consolidated statements
  const baseKeywords = ['요약', 'summary', '연결', 'consolidated', '재무', 'financial'];
  
  if (intentLower.includes('revenue') || intentLower.includes('sales')) {
    return [...baseKeywords, '매출', 'revenue', '수익'];
  } else if (intentLower.includes('profit')) {
    return [...baseKeywords, '이익', 'profit', '손익', '부문'];
  } else if (intentLower.includes('cash')) {
    return [...baseKeywords, '현금', 'cash'];
  } else if (intentLower.includes('asset') || intentLower.includes('balance')) {
    return [...baseKeywords, '자산', 'asset', '부채'];
  } else {
    // Very generic fallback
    return baseKeywords;
  }
}

/**
 * Execute search with progressive fallback strategy
 */
export async function searchWithFallback(
  filters: SearchFilters,
  queryIntent: string
): Promise<{ results: TableRow[]; strategy: SearchStrategy }> {
  const sqlBuilder = new SQLBuilder();
  const strategies = generateSearchStrategies(filters.keywords || [], queryIntent);
  
  for (const strategy of strategies) {
    // Update filters with current strategy keywords
    const strategyFilters: SearchFilters = {
      ...filters,
      keywords: strategy.keywords
    };
    
    // Build and execute query
    const { query: sqlQuery, params } = sqlBuilder.buildSearchQuery(strategyFilters);
    const results = await query<TableRow>(sqlQuery, params);
    
    // If we found results, return them with the strategy used
    if (results.length > 0) {
      console.log(`Search succeeded with ${strategy.level} strategy:`, strategy.description);
      return { results, strategy };
    }
    
    console.log(`No results with ${strategy.level} strategy, trying next...`);
  }
  
  // Last resort: get any recent tables for the company
  console.log('All strategies failed, fetching recent tables...');
  const { query: simpleQuery, params: simpleParams } = sqlBuilder.buildSimpleQuery(
    filters.corpCode,
    filters.limit || 5
  );
  const results = await query<TableRow>(simpleQuery, simpleParams);
  
  return {
    results,
    strategy: {
      level: 'fallback',
      keywords: [],
      description: 'Recent tables (no keyword match)'
    }
  };
}