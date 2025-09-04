/**
 * Query Enhancement Module
 * Intelligently enhances search keywords based on query patterns and intent
 */

interface QueryPattern {
  patterns: RegExp[];
  enhance: (keywords: string[]) => string[];
}

const QUERY_PATTERNS: QueryPattern[] = [
  // Revenue queries
  {
    patterns: [
      /revenue|sales|매출/i,
      /how much.*(?:revenue|sales|earn|make)/i,
      /total.*(?:revenue|sales)/i
    ],
    enhance: (keywords) => {
      const enhanced = new Set(keywords);
      // Add comprehensive revenue terms
      ['revenue', 'Revenue', 'sales', 'Sales', 'Sales Revenue', 
       '매출', '매출액', '수익', '매출수익', '판매', 
       '합계', '합 계', 'Total', 'Sum'].forEach(k => enhanced.add(k));
      return Array.from(enhanced);
    }
  },
  
  // Operating profit queries
  {
    patterns: [
      /operating.*profit/i,
      /영업.*이익/i,
      /profit.*trend/i,
      /operating.*income/i
    ],
    enhance: (keywords) => {
      const enhanced = new Set(keywords);
      // Add comprehensive operating profit terms
      ['operating', 'Operating', 'profit', 'Profit',
       'operating profit', 'Operating profit', 'Operating Profit',
       'operating income', 'Operating Income', 'EBIT',
       '영업', '이익', '영업이익', '영업손익', '영업수익',
       '손익', '영업이익(손실)',
       // Add broader terms for finding the right tables
       '요약', 'summary', 'Summary', '연결', 'consolidated', 'Consolidated',
       '재무', 'financial', 'Financial', '부문', 'segment', 'Segment'].forEach(k => enhanced.add(k));
      return Array.from(enhanced);
    }
  },

  // Net profit queries
  {
    patterns: [
      /net.*(?:profit|income)/i,
      /순.*이익/i,
      /bottom.*line/i
    ],
    enhance: (keywords) => {
      const enhanced = new Set(keywords);
      // Add comprehensive net profit terms
      ['net', 'Net', 'profit', 'income',
       'net profit', 'Net Profit', 'net income', 'Net Income',
       '순이익', '당기순이익', '당기순손익', '순손익',
       '당기순이익(손실)'].forEach(k => enhanced.add(k));
      return Array.from(enhanced);
    }
  },

  // Growth/YoY queries
  {
    patterns: [
      /growth|yoy|year.*over.*year/i,
      /성장|전년/i,
      /trend|change/i
    ],
    enhance: (keywords) => {
      const enhanced = new Set(keywords);
      // Add growth-related terms
      ['growth', 'Growth', 'YoY', 'yoy', 'year-over-year',
       'trend', 'trends', 'change', 'increase', 'decrease',
       '성장', '성장률', '전년대비', '전년동기대비', 
       '추이', '변화', '증가', '감소', '증감'].forEach(k => enhanced.add(k));
      // Also add time indicators
      ['latest', 'recent', '최근', '최신'].forEach(k => enhanced.add(k));
      return Array.from(enhanced);
    }
  },

  // Cash flow queries
  {
    patterns: [
      /cash.*flow/i,
      /현금.*흐름/i,
      /operating.*cash/i
    ],
    enhance: (keywords) => {
      const enhanced = new Set(keywords);
      // Add cash flow terms
      ['cash', 'Cash', 'flow', 'cash flow', 'Cash Flow',
       '현금', '현금흐름', '영업활동', '투자활동', '재무활동',
       '영업활동현금흐름', '투자활동현금흐름'].forEach(k => enhanced.add(k));
      return Array.from(enhanced);
    }
  },

  // Balance sheet queries
  {
    patterns: [
      /asset|liability|equity/i,
      /자산|부채|자본/i,
      /balance.*sheet/i
    ],
    enhance: (keywords) => {
      const enhanced = new Set(keywords);
      // Add balance sheet terms
      ['asset', 'Asset', 'assets', 'Assets',
       'liability', 'Liability', 'liabilities', 'debt',
       'equity', 'Equity', 'capital',
       '자산', '부채', '자본', '총자산', '총부채',
       '자기자본', '순자산'].forEach(k => enhanced.add(k));
      return Array.from(enhanced);
    }
  },

  // Latest/Recent data queries
  {
    patterns: [
      /latest|recent|current/i,
      /최근|최신|현재/i,
      /what.*(?:is|are).*(?:the|samsung)/i
    ],
    enhance: (keywords) => {
      const enhanced = new Set(keywords);
      // Add time indicators
      ['latest', 'recent', 'current', '최근', '최신', '현재',
       '제57기', '제56기', '2024', '2023'].forEach(k => enhanced.add(k));
      return Array.from(enhanced);
    }
  }
];

/**
 * Enhance keywords based on query patterns and intent
 * This function adds contextually relevant keywords that might not be explicitly mentioned
 */
export function enhanceKeywords(query: string, keywords: string[]): string[] {
  const enhancedKeywords = new Set(keywords);
  
  // Check each pattern and apply enhancements
  for (const pattern of QUERY_PATTERNS) {
    const matches = pattern.patterns.some(p => p.test(query));
    if (matches) {
      const enhanced = pattern.enhance(keywords);
      enhanced.forEach(k => enhancedKeywords.add(k));
    }
  }
  
  // Special handling for Korean queries
  if (/[가-힣]/.test(query)) {
    // If Korean query, ensure we have both Korean and English terms
    const hasKorean = Array.from(enhancedKeywords).some(k => /[가-힣]/.test(k));
    const hasEnglish = Array.from(enhancedKeywords).some(k => /[a-zA-Z]/.test(k));
    
    if (hasKorean && !hasEnglish) {
      // Add common English equivalents
      if (Array.from(enhancedKeywords).some(k => k.includes('매출'))) {
        ['revenue', 'sales', 'Revenue', 'Sales'].forEach(k => enhancedKeywords.add(k));
      }
      if (Array.from(enhancedKeywords).some(k => k.includes('이익'))) {
        ['profit', 'income', 'Profit', 'Income'].forEach(k => enhancedKeywords.add(k));
      }
    }
  }
  
  // Remove very common words that aren't helpful
  const stopWords = ['what', 'is', 'the', 'show', 'tell', 'find', 'give', 'me', 'for'];
  stopWords.forEach(word => enhancedKeywords.delete(word));
  
  return Array.from(enhancedKeywords);
}

/**
 * Analyze query intent to determine the type of financial data being requested
 * This helps in filtering and ranking search results
 */
export function analyzeQueryIntent(query: string): {
  primaryIntent: 'revenue' | 'profit' | 'cash_flow' | 'balance_sheet' | 'general';
  needsComparison: boolean;
  timeFrame: 'latest' | 'historical' | 'trend';
} {
  const lowerQuery = query.toLowerCase();
  
  // Determine primary intent
  let primaryIntent: 'revenue' | 'profit' | 'cash_flow' | 'balance_sheet' | 'general' = 'general';
  
  if (/revenue|sales|매출/.test(lowerQuery)) {
    primaryIntent = 'revenue';
  } else if (/profit|income|이익/.test(lowerQuery)) {
    primaryIntent = 'profit';
  } else if (/cash.*flow|현금.*흐름/.test(lowerQuery)) {
    primaryIntent = 'cash_flow';
  } else if (/asset|liability|equity|자산|부채|자본/.test(lowerQuery)) {
    primaryIntent = 'balance_sheet';
  }
  
  // Check if comparison is needed
  const needsComparison = /growth|yoy|trend|change|compare|vs|전년|성장|추이|변화/.test(lowerQuery);
  
  // Determine time frame
  let timeFrame: 'latest' | 'historical' | 'trend' = 'latest';
  if (/trend|historical|history|over.*time|추이|변화/.test(lowerQuery)) {
    timeFrame = 'trend';
  } else if (/past|previous|last.*year|작년|이전/.test(lowerQuery)) {
    timeFrame = 'historical';
  }
  
  return { primaryIntent, needsComparison, timeFrame };
}