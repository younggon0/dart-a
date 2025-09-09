'use client';

import { Card } from '@/components/ui/card';
import { Database, Calculator, CheckCircle, Loader2 } from 'lucide-react';

interface ProgressTrackerProps {
  currentPhase: 'idle' | 'extracting' | 'calculating' | 'assessing' | 'complete';
  language: 'en' | 'ko';
}

export default function ProgressTracker({ currentPhase, language }: ProgressTrackerProps) {
  const phases = [
    {
      id: 'extracting',
      icon: Database,
      title: {
        en: 'Data Extraction Agent',
        ko: '데이터 추출 에이전트',
      },
      description: {
        en: 'Extracting financial statements',
        ko: '재무제표 추출 중',
      },
      details: {
        en: 'Reading cash flow, income, and balance sheets',
        ko: '현금흐름표, 손익계산서, 재무상태표 읽기',
      },
    },
    {
      id: 'calculating',
      icon: Calculator,
      title: {
        en: 'Calculation Agent',
        ko: '계산 에이전트',
      },
      description: {
        en: 'Computing financial metrics',
        ko: '재무 지표 계산 중',
      },
      details: {
        en: 'Accruals, CF/NI ratio, M-Score calculation',
        ko: '발생액, CF/NI 비율, M-Score 계산',
      },
    },
    {
      id: 'assessing',
      icon: CheckCircle,
      title: {
        en: 'Quality Assessment Agent',
        ko: '품질 평가 에이전트',
      },
      description: {
        en: 'Evaluating earnings quality',
        ko: '수익 품질 평가 중',
      },
      details: {
        en: 'Applying thresholds and generating alerts',
        ko: '임계값 적용 및 경고 생성',
      },
    },
  ];

  const getPhaseStatus = (phaseId: string) => {
    const phaseOrder = ['extracting', 'calculating', 'assessing'];
    const currentIndex = phaseOrder.indexOf(currentPhase);
    const phaseIndex = phaseOrder.indexOf(phaseId);

    if (currentPhase === 'complete') return 'complete';
    if (phaseIndex < currentIndex) return 'complete';
    if (phaseIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <Card className="p-6 bg-white shadow-lg">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {language === 'en' ? 'Multi-Agent Processing' : '멀티 에이전트 처리'}
        </h3>
        
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          {/* Phases */}
          <div className="space-y-6">
            {phases.map((phase) => {
              const status = getPhaseStatus(phase.id);
              const Icon = phase.icon;
              
              return (
                <div key={phase.id} className="relative flex items-start gap-4">
                  {/* Icon */}
                  <div className={`
                    relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all
                    ${status === 'complete' ? 'bg-green-100 text-green-600' : 
                      status === 'active' ? 'bg-blue-100 text-blue-600 animate-pulse' : 
                      'bg-gray-100 text-gray-400'}
                  `}>
                    {status === 'active' ? (
                      <Loader2 className="h-8 w-8 animate-spin" />
                    ) : (
                      <Icon className="h-8 w-8" />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <h4 className={`font-semibold ${
                      status === 'pending' ? 'text-gray-400' : 'text-gray-900'
                    }`}>
                      {phase.title[language]}
                    </h4>
                    <p className={`text-sm mt-1 ${
                      status === 'pending' ? 'text-gray-400' : 
                      status === 'active' ? 'text-blue-600 font-medium' : 
                      'text-gray-600'
                    }`}>
                      {phase.description[language]}
                    </p>
                    {status === 'active' && (
                      <p className="text-xs text-gray-500 mt-1">
                        {phase.details[language]}
                      </p>
                    )}
                  </div>
                  
                  {/* Status Badge */}
                  {status === 'complete' && (
                    <div className="text-xs text-green-600 font-medium">
                      ✓ {language === 'en' ? 'Complete' : '완료'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}