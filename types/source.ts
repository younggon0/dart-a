/**
 * Source reference types for RAG-style citations
 */

export interface DataPoint {
  field: string;
  value: string;
  row?: number;
  column?: number;
  originalValue?: string;
}

export interface SourceReference {
  id: string;
  tableId: string;
  tableName: string;
  tableNameKo?: string;
  sourceFile: string;
  pageNumber: number;
  period?: string;
  confidence: number;
  statementType?: string;
  dataPoints: DataPoint[];
  relevanceScore?: number;
}

export interface SourcedResponse {
  content: string;
  sources: SourceReference[];
  primarySourceId?: string;
}