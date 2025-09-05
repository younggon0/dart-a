'use client';

import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, CheckCircle, AlertCircle, Table } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SourceReference } from '@/types/source';
import { TableViewer } from './TableViewer';
import { cn } from '@/lib/utils';

interface SourceCardProps {
  source: SourceReference;
  index: number;
  expanded?: boolean;
  onToggle?: () => void;
}

export function SourceCard({ source, index, expanded = false, onToggle }: SourceCardProps) {
  const [showTable, setShowTable] = useState(false);
  const confidenceColor = source.confidence >= 0.9 ? 'text-green-600' : 
                          source.confidence >= 0.7 ? 'text-yellow-600' : 'text-orange-600';
  
  const confidenceIcon = source.confidence >= 0.9 ? CheckCircle : AlertCircle;
  const ConfidenceIcon = confidenceIcon;

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <div 
        className="px-4 py-3 cursor-pointer"
        onClick={onToggle}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
              {index}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-sm">
                  {source.tableName || source.tableNameKo || 'Financial Table'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">
                  {source.sourceFile.split('/').pop()} • Page {source.pageNumber}
                </span>
                {source.period && (
                  <Badge variant="secondary" className="text-xs py-0">
                    {source.period}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <ConfidenceIcon className={cn("h-4 w-4", confidenceColor)} />
              <span className={cn("text-xs font-medium", confidenceColor)}>
                {Math.round(source.confidence * 100)}%
              </span>
            </div>
            {onToggle && (
              expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <div className="mt-4 pt-4 border-t">
            {/* Statement Type */}
            {source.statementType && (
              <div className="mb-3">
                <span className="text-xs text-gray-500">Statement Type:</span>
                <Badge variant="outline" className="ml-2 text-xs">
                  {source.statementType}
                </Badge>
              </div>
            )}

            {/* Data Points Used */}
            {source.dataPoints.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Data Used:</p>
                <div className="space-y-1">
                  {source.dataPoints.map((point, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-50 rounded px-2 py-1">
                      <span className="text-xs text-gray-700">{point.field}:</span>
                      <span className="text-xs font-mono font-semibold">{point.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {source.tableData && source.tableData.length > 0 && (
              <div className="mt-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTable(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                >
                  <Table className="h-3 w-3" />
                  View Table
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <TableViewer
        isOpen={showTable}
        onClose={() => setShowTable(false)}
        tableName={source.tableName || source.tableNameKo || 'Financial Table'}
        tableData={source.tableData}
        period={source.period}
      />
    </Card>
  );
}