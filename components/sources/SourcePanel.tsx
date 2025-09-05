'use client';

import React, { useState } from 'react';
import { FileSearch, ChevronRight, X } from 'lucide-react';
import { SourceReference } from '@/types/source';
import { SourceCard } from './SourceCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/translations';

interface SourcePanelProps {
  sources: SourceReference[];
  className?: string;
  variant?: 'inline' | 'sidebar' | 'expandable';
  language?: 'en' | 'ko';
}

export function SourcePanel({ sources, className, variant = 'expandable', language = 'en' }: SourcePanelProps) {
  const t = useTranslation(language);
  const [expanded, setExpanded] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCard = (sourceId: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(sourceId)) {
        next.delete(sourceId);
      } else {
        next.add(sourceId);
      }
      return next;
    });
  };

  if (!sources || sources.length === 0) {
    return null;
  }

  // Inline variant - always visible below message
  if (variant === 'inline') {
    return (
      <div className={cn("mt-4 space-y-2", className)}>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FileSearch className="h-4 w-4" />
          <span className="font-medium">{language === 'ko' ? `출처 (${sources.length})` : `Sources (${sources.length})`}</span>
        </div>
        <div className="space-y-2">
          {sources.map((source, index) => (
            <SourceCard
              key={source.id}
              source={source}
              index={index + 1}
              expanded={expandedCards.has(source.id)}
              onToggle={() => toggleCard(source.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  // Sidebar variant - fixed position
  if (variant === 'sidebar') {
    return (
      <div className={cn(
        "fixed right-0 top-0 h-full w-80 bg-white border-l shadow-lg transform transition-transform z-50",
        expanded ? "translate-x-0" : "translate-x-full",
        className
      )}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSearch className="h-5 w-5" />
              <h3 className="font-semibold">{language === 'ko' ? '사용된 출처' : 'Sources Used'}</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="p-4 overflow-y-auto h-full">
          <div className="space-y-2">
            {sources.map((source, index) => (
              <SourceCard
                key={source.id}
                source={source}
                index={index + 1}
                expanded={expandedCards.has(source.id)}
                onToggle={() => toggleCard(source.id)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Expandable variant - collapsed by default
  return (
    <div className={cn("mt-4", className)}>
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          <FileSearch className="h-4 w-4" />
          <span>{t.chat.viewSources(sources.length)}</span>
          <ChevronRight className="h-3 w-3" />
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileSearch className="h-4 w-4" />
              <span className="font-medium">{language === 'ko' ? '사용된 출처' : 'Sources Used'}</span>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {language === 'ko' ? '숨기기' : 'Hide'}
            </button>
          </div>
          <div className="space-y-2">
            {sources.map((source, index) => (
              <SourceCard
                key={source.id}
                source={source}
                index={index + 1}
                expanded={expandedCards.has(source.id)}
                onToggle={() => toggleCard(source.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}