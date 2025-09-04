// Keyword mapping for English to Korean financial terms
export const FINANCIAL_KEYWORDS_MAP: Record<string, string[]> = {
  // Revenue related - Include exact table title matches
  'revenue': ['revenue', 'sales', 'turnover', 'Sales Revenue', '매출', '매출액', '수익', '매출액'],
  'sales': ['sales', 'revenue', 'Sales Revenue', '매출', '매출액'],
  'latest revenue': ['Sales Revenue', 'revenue', '매출액', '최근 매출'],
  
  // Profit related
  'profit': ['profit', 'income', 'earnings', '이익', '수익'],
  'operating profit': ['operating profit', 'operating income', 'EBIT', '영업이익', '영업수익'],
  'net profit': ['net profit', 'net income', '순이익', '당기순이익'],
  
  // Growth related
  'growth': ['growth', 'increase', '성장', '성장률', '증가'],
  'yoy': ['yoy', 'year-over-year', 'y/y', '전년대비', '전년동기대비'],
  
  // Financial statements
  'balance sheet': ['balance sheet', 'statement of financial position', '재무상태표', '대차대조표'],
  'income statement': ['income statement', 'P&L', 'profit and loss', '손익계산서'],
  'cash flow': ['cash flow', 'cash flow statement', '현금흐름', '현금흐름표'],
  
  // Other financial terms
  'asset': ['asset', 'assets', '자산'],
  'liability': ['liability', 'liabilities', 'debt', '부채'],
  'equity': ['equity', 'shareholders equity', '자본', '자기자본'],
  'expense': ['expense', 'cost', '비용', '원가'],
  'investment': ['investment', 'capex', '투자', '설비투자'],
  'rnd': ['r&d', 'rnd', 'research', 'development', '연구개발', '연구개발비'],
};

export function expandKeywords(keywords: string[] | undefined): string[] {
  if (!keywords || !Array.isArray(keywords)) {
    return [];
  }
  
  const expanded = new Set<string>();
  
  keywords.forEach(keyword => {
    // Add original keyword
    expanded.add(keyword.toLowerCase());
    
    // Check if keyword matches any mapping
    const lowerKeyword = keyword.toLowerCase();
    for (const [key, values] of Object.entries(FINANCIAL_KEYWORDS_MAP)) {
      if (key.toLowerCase() === lowerKeyword || 
          values.some(v => v.toLowerCase() === lowerKeyword)) {
        // Add all related terms
        values.forEach(v => expanded.add(v));
      }
    }
  });
  
  return Array.from(expanded);
}