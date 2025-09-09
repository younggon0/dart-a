'use client';

import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Sparkles, ChevronRight } from 'lucide-react';
import { QueryAnalysis, AGENT_REGISTRY } from '@/lib/agents/types';

interface MasterAgentPanelProps {
  isActive: boolean;
  analysis?: QueryAnalysis | null;
  language: 'en' | 'ko';
  activeAgent?: string;
  currentStep?: string;
  stepProgress?: number;
}

export default function MasterAgentPanel({ isActive, analysis, language, activeAgent, currentStep, stepProgress }: MasterAgentPanelProps) {
  const [currentPhase, setCurrentPhase] = useState<'idle' | 'analyzing' | 'planning' | 'ready'>('idle');
  const [hasStarted, setHasStarted] = useState(false);
  const [masterStepKey, setMasterStepKey] = useState<'analyzing' | 'understanding' | 'planning' | 'ready'>('analyzing');
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const translations = {
    en: {
      masterAgent: 'Master Agent',
      analyzing: 'Analyzing query',
      understanding: 'Understanding requirements',
      planning: 'Planning execution strategy',
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
      masterAgent: '마스터 에이전트',
      analyzing: '쿼리 분석',
      understanding: '요구사항 이해',
      planning: '실행 전략 계획',
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
    if (isActive && !analysis && !hasStarted) {
      setHasStarted(true);
      setCurrentPhase('analyzing');
      setMasterStepKey('analyzing');
      
      // Clear any existing timeouts
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current = [];
      
      // Set up new timeouts
      const timeout1 = setTimeout(() => {
        setMasterStepKey('understanding');
      }, 800);
      
      const timeout2 = setTimeout(() => {
        setCurrentPhase('planning');
        setMasterStepKey('planning');
      }, 1600);
      
      const timeout3 = setTimeout(() => {
        setCurrentPhase('ready');
        setMasterStepKey('ready');
      }, 2400);
      
      timeoutsRef.current = [timeout1, timeout2, timeout3];
    }
  }, [isActive, hasStarted, analysis]); // Only depend on isActive, hasStarted, and analysis
  
  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);
  
  // Handle when analysis completes
  useEffect(() => {
    if (analysis && currentPhase === 'ready') {
      setMasterStepKey('ready');
    }
  }, [analysis, currentPhase]);

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
        {/* Agent Status Display */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200 animate-pulse">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              {activeAgent && currentPhase === 'ready' 
                ? `${AGENT_REGISTRY[activeAgent]?.icon} ${AGENT_REGISTRY[activeAgent]?.name}`
                : `🧠 ${t.masterAgent}`}
            </span>
          </div>
          {/* Show current step */}
          {((activeAgent && currentStep) || (!activeAgent && masterStepKey)) && (
            <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-700">
              <ChevronRight className="h-3.5 w-3.5" />
              <span>{activeAgent ? currentStep : t[masterStepKey]}</span>
              {activeAgent && stepProgress !== undefined && stepProgress > 0 && (
                <span className="text-blue-400 ml-1">({stepProgress}%)</span>
              )}
            </div>
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