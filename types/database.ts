export interface TableRow {
  id: string;
  corp_code: string;
  source_file: string;
  page_number: number;
  table_index?: number;
  data: Record<string, unknown> | unknown[][] | null; // JSONB data
  text_before?: string;
  text_after?: string;
  section?: string;
  dimensions?: Record<string, unknown> | null; // JSONB dimensions
  metadata?: TableMetadata; // JSONB metadata
  extraction_timestamp?: Date;
  created_at?: Date;
}

export interface TableMetadata {
  statement_type?: string;
  table_title?: string;
  table_title_en?: string;
  table_title_ko?: string;
  search_keywords_en?: string;
  search_keywords_ko?: string;
  has_headers?: boolean;
  confidence?: number;
  period_start?: string;
  period_end?: string;
  metrics?: string[];
  [key: string]: unknown;
}

export interface SearchFilters {
  corpCode: string;
  keywords?: string[];
  statementType?: string;
  dateRange?: [string, string];
  limit?: number;
}