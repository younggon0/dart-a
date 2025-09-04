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
    const prompt = `Analyze this financial query and extract key components.
Query: "${query}"

Extract:
1. Keywords - IMPORTANT: Return BOTH English and Korean versions for financial terms
   - For "revenue" include: ["revenue", "sales", "매출", "매출액"]
   - For "profit" include: ["profit", "operating profit", "영업이익", "이익"]
   - For "growth" include: ["growth", "YoY", "성장률", "전년대비"]
2. Statement type (financial, segment, cash_flow, etc.)
3. Time period or date range
4. Query intent (what the user wants to know)
5. Language (en or ko)

Return as JSON with fields: keywords (array with both English AND Korean terms), statementType, period, dateRange (if specific dates), intent, language`;

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

    // Fallback analysis with keyword expansion for common terms
    const words = query.toLowerCase().split(' ').filter(word => word.length > 2);
    const fallbackKeywords: string[] = [];
    
    // Add common financial term variations - be more specific
    words.forEach(word => {
      if (word.includes('revenue') || word.includes('sales')) {
        fallbackKeywords.push('revenue', 'Sales Revenue', 'sales', '매출', '매출액', '판매', '수익');
      } else if (word.includes('profit')) {
        fallbackKeywords.push('profit', 'operating profit', 'Operating Profit', '이익', '영업이익');
      } else if (word.includes('growth') || word.includes('yoy') || word.includes('year')) {
        fallbackKeywords.push('growth', 'yoy', 'year-over-year', '성장률', '전년대비', '전년동기대비');
      } else if (word.includes('cash')) {
        fallbackKeywords.push('cash', 'Cash Flow', 'cash flow', '현금', '현금흐름');
      } else if (word.includes('latest') || word.includes('recent')) {
        fallbackKeywords.push('latest', 'recent', '최근', '최신');
      } else if (word.length > 3) {
        fallbackKeywords.push(word);
      }
    });
    
    return {
      keywords: fallbackKeywords.length > 0 ? fallbackKeywords : ['financial', '재무'],
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
1. Analyze the actual data values in the tables
2. Provide specific numbers and figures from the data
3. Calculate growth rates if asked and data is available
4. Be precise and cite which table the data comes from
5. If the data doesn't contain the requested information, clearly state what's missing

Provide a clear, data-driven answer.`;

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