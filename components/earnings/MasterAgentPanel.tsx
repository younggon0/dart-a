'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Brain, Sparkles } from 'lucide-react';
import { QueryAnalysis } from '@/lib/agents/types';

interface MasterAgentPanelProps {
  isActive: boolean;
  analysis?: QueryAnalysis | null;
  language: 'en' | 'ko';
}

export default function MasterAgentPanel({ isActive, analysis, language }: MasterAgentPanelProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentPhase, setCurrentPhase] = useState<'idle' | 'analyzing' | 'planning' | 'ready'>('idle');

  const translations = {
    en: {
      title: 'Master Agent',
      analyzing: 'Analyzing query...',
      understanding: 'Understanding requirements...',
      planning: 'Planning execution strategy...',
      ready: 'Execution plan ready',
      identified: 'Identified Requirements',
      complexity: 'Complexity',
      confidence: 'Confidence',
      entities: 'Detected Entities',
      company: 'Company',
      metrics: 'Metrics',
      timeframe: 'Timeframe',
    },
    ko: {
      title: '마스터 에이전트',
      analyzing: '쿼리 분석 중...',
      understanding: '요구사항 이해 중...',
      planning: '실행 전략 계획 중...',
      ready: '실행 계획 준비 완료',
      identified: '식별된 요구사항',
      complexity: '복잡도',
      confidence: '신뢰도',
      entities: '감지된 엔티티',
      company: '회사',
      metrics: '지표',
      timeframe: '기간',
    },
  };

  const t = translations[language];

  useEffect(() => {
    if (isActive && !analysis) {
      setCurrentPhase('analyzing');
      setDisplayText(t.analyzing);
      
      setTimeout(() => {
        setDisplayText(t.understanding);
      }, 1000);
      
      setTimeout(() => {
        setCurrentPhase('planning');
        setDisplayText(t.planning);
      }, 2000);
    } else if (analysis) {
      setCurrentPhase('ready');
      setDisplayText(t.ready);
    } else {
      setCurrentPhase('idle');
      setDisplayText('');
    }
  }, [isActive, analysis, t]);

  const getComplexityColor = (complexity?: string) => {
    switch (complexity) {
      case 'simple': return 'text-green-600 bg-green-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      case 'complex': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (!isActive && !analysis) return null;

  return (
    <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg bg-purple-100 ${currentPhase === 'analyzing' || currentPhase === 'planning' ? 'animate-pulse' : ''}`}>
            <Brain className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{t.title}</h3>
            <p className="text-sm text-gray-600">
              {displayText}
              {(currentPhase === 'analyzing' || currentPhase === 'planning') && (
                <span className="inline-flex ml-1">
                  <span className="animate-pulse">.</span>
                  <span className="animate-pulse animation-delay-200">.</span>
                  <span className="animate-pulse animation-delay-400">.</span>
                </span>
              )}
            </p>
          </div>
          {currentPhase === 'ready' && (
            <Sparkles className="h-4 w-4 text-purple-600" />
          )}
        </div>

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-3 pt-2 border-t border-purple-200">
            {/* Requirements */}
            {analysis.requirements.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">{t.identified}:</p>
                <div className="space-y-1">
                  {analysis.requirements.map((req, index) => (
                    <div key={index} className="flex items-start gap-1.5">
                      <span className="text-purple-600 mt-0.5">•</span>
                      <span className="text-xs text-gray-600">{req}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-gray-500">{t.complexity}:</span>
                <span className={`px-2 py-0.5 rounded-full font-medium ${getComplexityColor(analysis.complexity)}`}>
                  {analysis.complexity}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">{t.confidence}:</span>
                <span className="font-medium text-gray-700">
                  {Math.round((analysis.confidence || 0) * 100)}%
                </span>
              </div>
            </div>

            {/* Entities */}
            {analysis.entities && Object.keys(analysis.entities).length > 0 && (
              <div className="pt-2 border-t border-purple-100">
                <p className="text-xs font-medium text-gray-700 mb-1">{t.entities}:</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.entities.company && (
                    <span className="text-xs px-2 py-1 bg-white rounded-md border border-purple-200">
                      {t.company}: {analysis.entities.company}
                    </span>
                  )}
                  {analysis.entities.timeframe && (
                    <span className="text-xs px-2 py-1 bg-white rounded-md border border-purple-200">
                      {t.timeframe}: {analysis.entities.timeframe}
                    </span>
                  )}
                  {analysis.entities.metrics && analysis.entities.metrics.length > 0 && (
                    <span className="text-xs px-2 py-1 bg-white rounded-md border border-purple-200">
                      {analysis.entities.metrics.length} {t.metrics}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        .animation-delay-400 {
          animation-delay: 400ms;
        }
      `}</style>
    </Card>
  );
}