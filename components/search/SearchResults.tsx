'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface SearchResult {
  id: string;
  corp_code: string;
  metadata?: {
    table_title?: string;
    table_title_en?: string;
    table_title_ko?: string;
    statement_type?: string;
    period_start?: string;
    period_end?: string;
    confidence?: number;
  };
  data?: any;
  relevance?: number;
}

interface SearchResultsProps {
  results: SearchResult[];
  isLoading?: boolean;
  onResultClick?: (result: SearchResult) => void;
}

export default function SearchResults({ results, isLoading, onResultClick }: SearchResultsProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          No results found. Try adjusting your search criteria.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((result) => {
        const isExpanded = expandedIds.has(result.id);
        const title = result.metadata?.table_title_en || 
                     result.metadata?.table_title_ko || 
                     result.metadata?.table_title || 
                     'Untitled Table';
        
        return (
          <Card key={result.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{title}</CardTitle>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {result.metadata?.statement_type && (
                      <Badge variant="outline">
                        {result.metadata.statement_type}
                      </Badge>
                    )}
                    {result.metadata?.period_end && (
                      <Badge variant="secondary">
                        {new Date(result.metadata.period_end).toLocaleDateString()}
                      </Badge>
                    )}
                    {result.relevance && result.relevance > 0 && (
                      <Badge className="bg-green-100 text-green-800">
                        Relevance: {result.relevance}
                      </Badge>
                    )}
                    {result.metadata?.confidence && (
                      <Badge 
                        className={
                          result.metadata.confidence > 0.8 
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        Confidence: {(result.metadata.confidence * 100).toFixed(0)}%
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(result.id)}
                >
                  {isExpanded ? 'Collapse' : 'Expand'}
                </Button>
              </div>
            </CardHeader>
            
            {isExpanded && (
              <CardContent>
                <div className="space-y-2">
                  {result.metadata?.period_start && (
                    <div className="text-sm">
                      <span className="font-semibold">Period:</span>{' '}
                      {new Date(result.metadata.period_start).toLocaleDateString()} - {' '}
                      {result.metadata.period_end ? new Date(result.metadata.period_end).toLocaleDateString() : 'Present'}
                    </div>
                  )}
                  
                  {result.data && (
                    <div className="mt-4">
                      <div className="text-sm font-semibold mb-2">Table Data:</div>
                      <div className="bg-gray-50 p-3 rounded-lg overflow-x-auto">
                        <pre className="text-xs">{JSON.stringify(result.data, null, 2)}</pre>
                      </div>
                    </div>
                  )}

                  {onResultClick && (
                    <Button 
                      className="mt-4"
                      onClick={() => onResultClick(result)}
                    >
                      View Details
                    </Button>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}