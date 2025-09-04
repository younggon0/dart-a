import Anthropic from '@anthropic-ai/sdk';
import { config } from './config';
import { TableRow } from '@/types/database';

const anthropic = new Anthropic({
  apiKey: config.anthropic.apiKey,
});

export interface QueryAnalysis {
  keywords?: string[];
  statementType?: string;
  metrics?: string[];
  period?: string;
  dateRange?: [string, string];
  intent: string;
  language: 'en' | 'ko';
}

export async function analyzeQuery(query: string): Promise<QueryAnalysis> {
  try {
    const prompt = `You are a financial data search expert. Analyze this query and generate COMPREHENSIVE search keywords.

Query: "${query}"

Your task is to think deeply about:
1. What financial concept is being asked about?
2. How might this concept appear in Korean financial statements?
3. What are ALL the possible ways to express this in financial tables?

IMPORTANT: Korean financial statements use specific terminology:
- Revenue appears as: 매출액, 매출, 수익, 판매, Sales Revenue, Revenue, 수익(매출액), 매출수익
- Operating profit appears as: 영업이익, 영업손익, 영업수익, Operating profit, Operating income, EBIT, 영업이익(손실)
- Net profit appears as: 당기순이익, 순이익, 당기순손익, Net income, Net profit, 당기순이익(손실)
- Total/Sum rows appear as: 합계, 합 계, 계, Total, Sum, 총계
- Fiscal periods: 제X기 (Xth fiscal year), 반기 (half-year), 분기 (quarter)

Analysis approach:
1. Identify the CORE financial concept (revenue, profit, assets, cash flow, etc.)
2. Generate ALL variations:
   - Common English terms (including abbreviations)
   - Korean translations (including variations)
   - How it appears in table headers
   - Related line items that contain this data
   - Consider if looking for totals vs specific items

3. For profit-related queries:
   - Include BOTH the specific profit type AND general profit terms
   - Include 이익, 손익, 수익 variations
   - Include negative forms (손실)

4. For revenue queries:
   - Include total row identifiers (합계)
   - Include segment identifiers if relevant

5. For trend/growth queries:
   - Include comparison terms: 전년대비, YoY, 성장률, 증가율, 변화, 추이, trends
   - Include period identifiers

Return JSON with:
- keywords: Array of ALL relevant search terms (be VERY comprehensive, 10-20 terms typical)
- statementType: Type of statement to search
- intent: What the user wants to know
- language: Query language (en/ko)

Be exhaustive with keywords - it's better to have too many than too few.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      temperature: 0,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    
    // Parse JSON response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError);
    }

    // Enhanced fallback analysis with comprehensive keyword generation
    const words = query.toLowerCase().split(' ').filter(word => word.length > 2);
    const fallbackKeywords = new Set<string>();
    
    // Analyze each word and generate comprehensive variations
    words.forEach(word => {
      // Revenue related
      if (word.includes('revenue') || word.includes('sales')) {
        // Add all possible revenue variations
        ['revenue', 'Revenue', 'Sales Revenue', 'sales', 'Sales', '매출', '매출액', 
         '수익', '판매', '매출수익', '수익(매출액)', '합계', '합 계'].forEach(k => fallbackKeywords.add(k));
      }
      // Profit related
      if (word.includes('profit') || word.includes('income')) {
        // Determine profit type and add variations
        if (word.includes('operating') || query.includes('operating')) {
          ['영업이익', '영업손익', '영업수익', 'operating profit', 'Operating profit',
           'Operating Profit', 'operating income', 'Operating Income', 'EBIT', '영업이익(손실)'].forEach(k => fallbackKeywords.add(k));
        } else if (word.includes('net')) {
          ['당기순이익', '순이익', '당기순손익', 'net income', 'Net income',
           'Net Income', 'net profit', 'Net Profit', '당기순이익(손실)'].forEach(k => fallbackKeywords.add(k));
        } else {
          // Generic profit - include all types
          ['profit', 'Profit', 'income', 'Income', '이익', '영업이익', '순이익',
           '손익', '수익', 'operating profit', 'net profit'].forEach(k => fallbackKeywords.add(k));
        }
      }
      // Operating specific
      if (word.includes('operating')) {
        ['영업', '영업이익', '영업수익', '영업손익', 'operating', 'Operating'].forEach(k => fallbackKeywords.add(k));
      }
      // Trends and growth
      if (word.includes('trend') || word.includes('growth') || word.includes('yoy')) {
        ['trend', 'trends', 'growth', 'YoY', 'yoy', 'year-over-year', '추이', '변화', 
         '동향', '성장', '성장률', '증가', '증가율', '전년대비', '전년동기대비'].forEach(k => fallbackKeywords.add(k));
      }
      // Cash flow
      if (word.includes('cash')) {
        ['cash', 'Cash', 'cash flow', 'Cash Flow', '현금', '현금흐름', 
         '영업활동', '투자활동', '재무활동'].forEach(k => fallbackKeywords.add(k));
      }
      // Time related
      if (word.includes('latest') || word.includes('recent')) {
        ['latest', 'recent', '최근', '최신', '최최근'].forEach(k => fallbackKeywords.add(k));
      }
      // Add the word itself if significant
      if (word.length > 3 && !['what', 'show', 'tell', 'find', 'give'].includes(word)) {
        fallbackKeywords.add(word);
      }
    });
    
    return {
      keywords: fallbackKeywords.size > 0 ? Array.from(fallbackKeywords) : ['financial', '재무', '재무제표'],
      intent: 'search',
      language: /[가-힣]/.test(query) ? 'ko' : 'en',
    };
  } catch (error) {
    console.error('Query analysis error:', error);
    throw error;
  }
}

export async function generateResponse(
  query: string,
  context: string,
  searchResults: TableRow[],
  language: 'en' | 'ko' = 'en'
): Promise<string> {
  try {
    const prompt = `You are a financial data analyst. Based on the following table data, answer the user's question in ${language === 'ko' ? 'Korean' : 'English'}.

User Question: "${query}"

Context with Actual Data:
${context}

Instructions:
1. CRITICAL - Korean financial data unit conversion:
   - ALL numbers in tables are in 백만원 (million KRW) units
   - DO NOT divide by 10 or 100 - use the numbers as-is
   - Conversion: 3,008,709 백만원 = 3,008,709 million KRW = 3,008.709 billion KRW = 3.009 trillion KRW
   - For the "합 계" row: "3,008,709" means 3.009 trillion KRW (NOT 300.87)
   - Numbers with "△" are negative

2. Understanding Korean fiscal periods:
   - "제X기" = Xth fiscal year since company founding
   - Higher numbers = more recent years (제56기 is newer than 제55기)
   - "반기" = half-year/semi-annual (e.g., "제57기 반기" = 57th period half-year)
   - The actual calendar year varies by company founding date

3. For revenue and operating profit questions:
   - Revenue: Look for "매출액" or "합 계" (total) row
   - Operating profit: Look for "영업이익" or "Operating profit" row
   - Table columns typically show: [current half-year, latest full year, previous full year]
   - Example for operating profit: ["11,361,329", "32,725,961", "6,566,976"] means:
     * Current half-year: 11.36 trillion KRW
     * Latest full year: 32.73 trillion KRW  
     * Previous full year: 6.57 trillion KRW

4. For profit trend analysis:
   - Find operating profit ("영업이익") for multiple years
   - Calculate growth rates between consecutive years
   - If you see negative numbers (△), that means loss
   - Example trend analysis:
     * 2023: 6.57 trillion KRW
     * 2024: 32.73 trillion KRW (growth: +398%)
     * Show the dramatic turnaround if applicable

5. ALWAYS calculate year-over-year growth when comparing periods:
   - Formula: ((Current - Previous) / Previous) × 100
   - Handle negative values properly (losses to profits = turnaround)

6. Format your response clearly:
   - State specific numbers with units (trillion KRW)
   - Show year-over-year growth percentages
   - Include division/segment breakdown if relevant
   - Highlight significant trends (turnarounds, major growth, etc.)

Provide a concise, data-driven answer with specific calculations.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    return response.content[0].type === 'text' ? response.content[0].text : 'Unable to generate response.';
  } catch (error) {
    console.error('Response generation error:', error);
    throw error;
  }
}