/**
 * Smart search that knows where to look for specific financial data
 */

import { query } from '@/lib/db';
import { TableRow } from '@/types/database';

interface SearchIntent {
  type: 'revenue' | 'profit' | 'cash_flow' | 'balance_sheet' | 'general';
  needsHistorical: boolean;
}

/**
 * Analyze query to understand what the user is looking for
 */
export function analyzeSearchIntent(userQuery: string): SearchIntent {
  const lower = userQuery.toLowerCase();
  const korean = userQuery;
  
  let type: SearchIntent['type'] = 'general';
  
  if (lower.includes('revenue') || lower.includes('sales') || korean.includes('매출')) {
    type = 'revenue';
  } else if (lower.includes('profit') || lower.includes('income') || korean.includes('이익')) {
    type = 'profit';
  } else if (lower.includes('cash') || korean.includes('현금')) {
    type = 'cash_flow';
  } else if (lower.includes('asset') || lower.includes('liability') || korean.includes('자산') || korean.includes('부채')) {
    type = 'balance_sheet';
  }
  
  const needsHistorical = 
    lower.includes('trend') || 
    lower.includes('growth') || 
    lower.includes('year') ||
    lower.includes('last') ||
    korean.includes('추이') ||
    korean.includes('성장') ||
    korean.includes('년');
  
  return { type, needsHistorical };
}

/**
 * Smart search that knows where financial data typically lives
 */
export async function smartSearch(
  corpCode: string,
  userQuery: string,
  limit: number = 10
): Promise<TableRow[]> {
  const intent = analyzeSearchIntent(userQuery);
  
  // Check if query is asking about a different company
  const queryLower = userQuery.toLowerCase();
  if (queryLower.includes('apple') || queryLower.includes('google') || 
      queryLower.includes('microsoft') || queryLower.includes('amazon')) {
    // Return empty array for queries about other companies
    return [];
  }
  
  // For profit and revenue queries, prioritize summary and segment tables
  if (intent.type === 'revenue' || intent.type === 'profit') {
    // First, try to find summary consolidated financial statements
    const summaryQuery = `
      SELECT *
      FROM tables
      WHERE corp_code = $1
        AND (
          -- Look for summary tables first (most likely to have comprehensive data)
          metadata->>'table_title_en' ILIKE '%summary%financial%'
          OR metadata->>'table_title_ko' ILIKE '%요약%재무%'
          
          -- Also look for segment reports (often contain operating profit)
          OR metadata->>'table_title_en' ILIKE '%segment%'
          OR metadata->>'table_title_ko' ILIKE '%부문%'
          
          -- Or consolidated statements
          OR metadata->>'table_title_en' ILIKE '%consolidated%'
          OR metadata->>'table_title_ko' ILIKE '%연결%'
        )
        -- Ensure it actually has the data we need
        AND (
          data::text ILIKE '%영업이익%'
          OR data::text ILIKE '%매출%'
          OR data::text ILIKE '%operating profit%'
          OR data::text ILIKE '%revenue%'
        )
      ORDER BY 
        -- Prioritize summary tables
        CASE 
          WHEN metadata->>'table_title_en' ILIKE '%summary%' THEN 1
          WHEN metadata->>'table_title_ko' ILIKE '%요약%' THEN 1
          ELSE 2
        END,
        -- Then by recency
        source_file DESC
      LIMIT $2
    `;
    
    const results = await query<TableRow>(summaryQuery, [corpCode, limit]);
    
    if (results.length > 0) {
      console.log('Smart search found summary/segment tables');
      return results;
    }
  }
  
  // For cash flow queries
  if (intent.type === 'cash_flow') {
    const cashFlowQuery = `
      SELECT *
      FROM tables
      WHERE corp_code = $1
        AND (
          metadata->>'table_title_en' ILIKE '%cash%flow%'
          OR metadata->>'table_title_ko' ILIKE '%현금%흐름%'
          OR data::text ILIKE '%영업활동%현금%'
          OR data::text ILIKE '%투자활동%현금%'
        )
      ORDER BY source_file DESC
      LIMIT $2
    `;
    
    const results = await query<TableRow>(cashFlowQuery, [corpCode, limit]);
    
    if (results.length > 0) {
      console.log('Smart search found cash flow tables');
      return results;
    }
  }
  
  // Fallback: general financial data search
  const generalQuery = `
    SELECT *
    FROM tables
    WHERE corp_code = $1
      AND (
        metadata->>'statement_type' IN ('financial', 'income_statement', 'balance_sheet', 'cash_flow')
        OR metadata->>'table_title_en' ILIKE '%financial%'
        OR metadata->>'table_title_ko' ILIKE '%재무%'
      )
    ORDER BY 
      -- Prioritize by statement type
      CASE metadata->>'statement_type'
        WHEN 'income_statement' THEN 1
        WHEN 'financial' THEN 2
        WHEN 'balance_sheet' THEN 3
        WHEN 'cash_flow' THEN 4
        ELSE 5
      END,
      source_file DESC
    LIMIT $2
  `;
  
  console.log('Smart search using general financial query');
  return await query<TableRow>(generalQuery, [corpCode, limit]);
}