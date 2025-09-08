'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Search, AlertCircle } from 'lucide-react';
import AnalysisReport from './AnalysisReport';
import RequirementsConfirmation from './RequirementsConfirmation';
import UnifiedExecutionView from './UnifiedExecutionView';
import { Task, AgentMessage, QueryAnalysis, ExecutionPlan as ExecutionPlanType } from '@/lib/agents/types';
import { MasterAgent } from '@/lib/agents/MasterAgent';

interface EarningsQualityInterfaceProps {
  language: 'en' | 'ko';
}

interface AnalysisResult {
  status: 'success' | 'error';
  rating?: {
    score: number;
    grade: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR';
    confidence: number;
  };
  metrics?: {
    accruals: number;
    accruals_ratio: number;
    cf_ni_ratio: number;
    m_score: number;
    total_assets: number;
    net_income: number;
    operating_cf: number;
  };
  alerts?: Array<{
    severity: 'info' | 'warning' | 'error';
    message: string;
    metric?: string;
  }>;
  execution_time?: {
    extraction: number;
    calculation: number;
    assessment: number;
    total: number;
  };
  sources?: Array<{
    table_name: string;
    source_file: string;
    page_number: number;
    period: string;
  }>;
  error?: string;
}

const DEMO_QUERY = {
  en: "Analyze Samsung's earnings quality. Check for red flags in accruals, compare cash flow to net income, identify any one-time items, and calculate the Beneish M-Score. Give me a quality rating and specific concerns.",
  ko: "삼성의 수익 품질을 분석하세요. 발생액의 위험 신호를 확인하고, 현금 흐름과 순이익을 비교하고, 일회성 항목을 식별하고, Beneish M-Score를 계산하세요. 품질 등급과 구체적인 우려 사항을 알려주세요."
};

export default function EarningsQualityInterface({ language }: EarningsQualityInterfaceProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'idle' | 'requirements' | 'executing' | 'complete'>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // New state for requirement confirmation flow
  const [extractedRequirements, setExtractedRequirements] = useState<string[]>([]);
  const [confirmedRequirements, setConfirmedRequirements] = useState<string[]>([]);
  const [requirementsConfirmed, setRequirementsConfirmed] = useState(false);
  const [queryAnalysis, setQueryAnalysis] = useState<QueryAnalysis | null>(null);
  const [executionPlan, setExecutionPlan] = useState<ExecutionPlanType | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([]);
  const [activeAgent, setActiveAgent] = useState<string | undefined>();
  const [activeAction, setActiveAction] = useState<string | undefined>();

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setQueryAnalysis(null);
    setExecutionPlan(null);
    setTasks([]);
    setAgentMessages([]);
    setRequirementsConfirmed(false);
    
    // Add delay before showing requirements for better UX
    await new Promise(resolve => setTimeout(resolve, 2500 + Math.random() * 1000)); // 2.5-3.5s delay
    
    // Extract requirements from query
    const masterAgent = new MasterAgent();
    const requirements = masterAgent.extractRequirements(DEMO_QUERY[language]);
    setExtractedRequirements(requirements);
    setCurrentPhase('requirements');
    setIsAnalyzing(false);
  };
  
  const handleRequirementsConfirmed = async (selectedRequirements: string[]) => {
    setConfirmedRequirements(selectedRequirements);
    setRequirementsConfirmed(true);
    
    // Add delay for planning phase
    await new Promise(resolve => setTimeout(resolve, 3000)); // Fixed 3s delay to match spinner
    
    setCurrentPhase('executing');

    try {
      // Use the orchestrated endpoint with streaming and confirmed requirements
      const response = await fetch('/api/earnings-quality/orchestrated', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          corpCode: '00126380', // Samsung hardcoded
          query: DEMO_QUERY[language],
          language,
          confirmedRequirements: selectedRequirements
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      // Read the streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

          for (const line of lines) {
            const data = line.slice(6); // Remove 'data: ' prefix
            if (data === '[DONE]') continue;

            try {
              const event = JSON.parse(data);
              handleStreamEvent(event);
            } catch (e) {
              console.error('Failed to parse event:', e);
            }
          }
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setCurrentPhase('idle');
    }
  };

  const handleStreamEvent = (event: any) => {
    switch (event.type) {
      case 'analysis':
        setQueryAnalysis(event.data);
        break;
      case 'plan':
        setExecutionPlan(event.data);
        setTasks(event.data.tasks);
        break;
      case 'message':
        setAgentMessages(prev => [...prev, event.data]);
        break;
      case 'task_update':
        setTasks(prev => updateTaskInList(prev, event.data));
        // Extract active agent and action from task update
        if (event.data.status === 'in-progress' && event.data.assignedAgent) {
          setActiveAgent(event.data.assignedAgent);
          // Determine action based on task type
          if (event.data.type === 'extraction') setActiveAction('fetching');
          else if (event.data.type === 'calculation') setActiveAction('calculating');
          else if (event.data.type === 'assessment') setActiveAction('assessing');
          else if (event.data.type === 'report') setActiveAction('reporting');
          else setActiveAction('executing');
        }
        break;
      case 'result':
        setResult(event.data);
        setCurrentPhase('complete');
        break;
      case 'error':
        setError(event.data.message);
        setCurrentPhase('idle');
        break;
    }
  };

  const updateTaskInList = (tasks: Task[], updatedTask: Task): Task[] => {
    return tasks.map(task => {
      if (task.id === updatedTask.id) {
        return updatedTask;
      }
      if (task.subtasks) {
        return {
          ...task,
          subtasks: updateTaskInList(task.subtasks, updatedTask)
        };
      }
      return task;
    });
  };

  const translations = {
    en: {
      title: 'Analysis Query',
      subtitle: '',
      query_label: 'Query',
      analyze_button: 'Ask',
      analyzing: 'Understanding requirements...',
      company: 'Target Company',
      samsung: 'Samsung Electronics Co., Ltd.',
      value_prop: 'What takes analysts hours, we do in minutes',
    },
    ko: {
      title: '분석 쿼리',
      subtitle: '',
      query_label: '쿼리',
      analyze_button: '질문',
      analyzing: '요구사항 파악 중...',
      company: '대상 기업',
      samsung: '삼성전자 주식회사',
      value_prop: '애널리스트가 몇 시간 걸리는 작업을 몇 분 만에',
    },
  };

  const t = translations[language];

  return (
    <div className="space-y-6">
      {/* Query Card */}
      <Card className="p-6 bg-white shadow-lg">
        <div className="space-y-4">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.company}
              </label>
              <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-900 font-medium">
                {t.samsung}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.query_label}
            </label>
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-800 leading-relaxed">
                {DEMO_QUERY[language]}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 italic">{t.value_prop}</p>
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || currentPhase !== 'idle'}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                  {t.analyzing}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  {t.analyze_button}
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Requirements Confirmation */}
      {(currentPhase === 'requirements' || currentPhase === 'executing' || currentPhase === 'complete') && extractedRequirements.length > 0 && (
        <RequirementsConfirmation
          requirements={extractedRequirements}
          onConfirm={handleRequirementsConfirmed}
          language={language}
          isConfirmed={requirementsConfirmed}
        />
      )}
      
      {/* Unified Execution View */}
      {tasks.length > 0 && (
        <UnifiedExecutionView
          tasks={tasks}
          language={language}
          activeAgent={activeAgent}
          activeAction={activeAction}
        />
      )}

      {/* Error Display */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        </Card>
      )}

      {/* Analysis Report */}
      {result && result.status === 'success' && (
        <AnalysisReport 
          result={result} 
          language={language}
        />
      )}
    </div>
  );
}