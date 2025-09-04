import Anthropic from '@anthropic-ai/sdk';
import { config } from './config';

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
1. Keywords (financial terms, metrics)
2. Statement type (financial, segment, cash_flow, etc.)
3. Time period or date range
4. Query intent (what the user wants to know)
5. Language (en or ko)

Return as JSON with fields: keywords (array), statementType, period, dateRange (if specific dates), intent, language`;

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

    // Fallback analysis
    return {
      keywords: query.toLowerCase().split(' ').filter(word => word.length > 3),
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
  searchResults: any[],
  language: 'en' | 'ko' = 'en'
): Promise<string> {
  try {
    const resultsContext = searchResults
      .map((r, i) => `Table ${i+1}: ${r.metadata?.table_title_en || r.metadata?.table_title || 'Untitled'}
Period: ${r.metadata?.period_end || 'Unknown'}
Type: ${r.metadata?.statement_type || 'Unknown'}`)
      .join('\n\n');

    const prompt = `Based on these search results, answer the user's question in ${language === 'ko' ? 'Korean' : 'English'}.

User Question: "${query}"

Search Results:
${resultsContext}

Provide a clear, concise answer focusing on the data found. If no relevant data was found, say so clearly.`;

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