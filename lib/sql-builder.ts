import { SearchFilters } from '@/types/database';

export class SQLBuilder {
  private baseQuery = `
    SELECT *
    FROM tables
    WHERE corp_code = $1
  `;

  buildSearchQuery(filters: SearchFilters): { query: string; params: unknown[] } {
    const queryParts: string[] = [this.baseQuery.trim()];
    const params: unknown[] = [filters.corpCode];

    // Add keyword search with relevance scoring
    if (filters.keywords && filters.keywords.length > 0) {
      const keywordConditions: string[] = [];
      const relevanceScores: string[] = [];

      filters.keywords.forEach((keyword) => {
        const paramIndex = params.length + 1;
        params.push(`%${keyword}%`);

        keywordConditions.push(`
          (metadata->>'table_title_en' ILIKE $${paramIndex} OR
           metadata->>'table_title_ko' ILIKE $${paramIndex} OR
           metadata->>'search_keywords_en' ILIKE $${paramIndex} OR
           metadata->>'search_keywords_ko' ILIKE $${paramIndex})
        `);

        relevanceScores.push(`
          CASE 
            WHEN metadata->>'table_title_en' ILIKE $${paramIndex} THEN 5
            WHEN metadata->>'table_title_ko' ILIKE $${paramIndex} THEN 4
            WHEN metadata->>'search_keywords_en' ILIKE $${paramIndex} THEN 2
            ELSE 0
          END
        `);
      });

      queryParts.push(`AND (${keywordConditions.join(' OR ')})`);
      
      // Add relevance scoring to SELECT
      const relevanceCalc = relevanceScores.join(' + ');
      queryParts[0] = `
        SELECT *, (${relevanceCalc}) as relevance
        FROM tables
        WHERE corp_code = $1
      `;
    }

    // Filter by statement type
    if (filters.statementType) {
      queryParts.push(`AND metadata->>'statement_type' = $${params.length + 1}`);
      params.push(filters.statementType);
    }

    // Filter by date range
    if (filters.dateRange) {
      const [startDate, endDate] = filters.dateRange;
      queryParts.push(`AND (metadata->>'period_end')::date BETWEEN $${params.length + 1} AND $${params.length + 2}`);
      params.push(startDate, endDate);
    }

    // Add ordering
    if (filters.keywords && filters.keywords.length > 0) {
      queryParts.push(`ORDER BY relevance DESC, (metadata->>'period_end')::date DESC NULLS LAST`);
    } else {
      queryParts.push(`ORDER BY (metadata->>'period_end')::date DESC NULLS LAST`);
    }

    // Add limit
    queryParts.push(`LIMIT $${params.length + 1}`);
    params.push(filters.limit || 5);

    return {
      query: queryParts.join('\n'),
      params,
    };
  }

  buildSimpleQuery(corpCode: string, limit: number = 5): { query: string; params: unknown[] } {
    return {
      query: `
        SELECT *
        FROM tables
        WHERE corp_code = $1
        ORDER BY created_at DESC
        LIMIT $2
      `,
      params: [corpCode, limit],
    };
  }

  buildStatsQuery(corpCode: string): { query: string; params: unknown[] } {
    return {
      query: `
        SELECT 
          COUNT(*) as total_tables,
          COUNT(DISTINCT metadata->>'statement_type') as statement_types,
          MIN((metadata->>'period_start')::date) as earliest_period,
          MAX((metadata->>'period_end')::date) as latest_period
        FROM tables
        WHERE corp_code = $1
      `,
      params: [corpCode],
    };
  }
}