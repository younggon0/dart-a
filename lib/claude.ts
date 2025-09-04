import Anthropic from '@anthropic-ai/sdk';
import { config } from './config';

const anthropic = new Anthropic({
  apiKey: config.anthropic.apiKey,
});

export interface QueryAnalysis {
  concept: 'revenue' | 'profit' | 'cash_flow' | 'balance_sheet' | 'general';
  keywords: string[];
  language: 'en' | 'ko';
}

/**
 * Simple query analysis using Claude
 */
export async function analyzeQuery(query: string): Promise<QueryAnalysis> {
  try {
    // Simple prompt inline (avoiding fs in API routes)
    const prompt = `You are a financial data search expert. Analyze this query and extract key search terms.

Query: "${query}"

Identify the core financial concepts and generate relevant search keywords:
- Include both English and Korean terms
- Focus on the main financial concept (revenue, profit, cash flow, etc.)
- Include common variations used in financial statements

Common Korean financial terms:
- Revenue: 매출, 매출액, 수익
- Operating profit: 영업이익, 영업손익
- Net profit: 당기순이익, 순이익
- Assets: 자산
- Liabilities: 부채
- Cash flow: 현금흐름

Return JSON with:
{
  "concept": "revenue|profit|cash_flow|balance_sheet|general",
  "keywords": ["term1", "term2", ...],
  "language": "en|ko"
}

Be concise - return 5-10 most relevant keywords.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 300,
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

    // Simple fallback - extract basic concept from query
    return getFallbackAnalysis(query);
  } catch (error) {
    console.error('Query analysis error:', error);
    return getFallbackAnalysis(query);
  }
}

/**
 * Simple fallback when Claude fails
 */
function getFallbackAnalysis(query: string): QueryAnalysis {
  const lower = query.toLowerCase();
  const hasKorean = /[가-힣]/.test(query);
  
  // Determine concept
  let concept: QueryAnalysis['concept'] = 'general';
  const keywords: string[] = [];
  
  if (lower.includes('revenue') || lower.includes('sales') || query.includes('매출')) {
    concept = 'revenue';
    keywords.push('매출', 'revenue', '매출액');
  } else if (lower.includes('profit') || query.includes('이익')) {
    concept = 'profit';
    keywords.push('이익', 'profit', '영업이익');
  } else if (lower.includes('cash') || query.includes('현금')) {
    concept = 'cash_flow';
    keywords.push('현금', 'cash', '현금흐름');
  } else if (lower.includes('asset') || lower.includes('debt') || query.includes('자산')) {
    concept = 'balance_sheet';
    keywords.push('자산', 'asset', '부채');
  }
  
  // Add generic financial terms as fallback
  if (keywords.length === 0) {
    keywords.push('재무', 'financial', '손익');
  }
  
  return {
    concept,
    keywords,
    language: hasKorean ? 'ko' : 'en'
  };
}

/**
 * Generate response using Claude
 */
export async function generateResponse(
  query: string,
  context: string,
  language: 'en' | 'ko' = 'en'
): Promise<string> {
  const systemPrompt = `You are a financial analyst. Answer questions using the provided financial data.
${language === 'ko' ? 'Answer in Korean.' : 'Answer in English.'}

Instructions:
- Be factual and cite specific numbers
- Include units (백만원, trillion KRW, etc.)
- Calculate growth rates when comparing periods
- Format: 제X기 = Xth fiscal year
- Numbers are in 백만원 (million KRW)`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1000,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: `Question: ${query}\n\nFinancial Data:\n${context}`,
      }],
      system: systemPrompt
    });

    return response.content[0].type === 'text' ? response.content[0].text : 'Unable to generate response.';
  } catch (error) {
    console.error('Response generation error:', error);
    return language === 'ko' 
      ? '죄송합니다. 응답을 생성할 수 없습니다.'
      : 'Sorry, unable to generate a response.';
  }
}