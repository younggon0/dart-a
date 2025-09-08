'use client';

import { Card } from '@/components/ui/card';
import { CheckCircle2, Circle, Clock, AlertCircle, Sparkles, ChevronRight } from 'lucide-react';
import { Task, AGENT_REGISTRY } from '@/lib/agents/types';
import { useState, useEffect, useRef } from 'react';

interface ExecutionPlanProps {
  tasks: Task[];
  language: 'en' | 'ko';
  activeAgent?: string;
  activeAction?: string;
  onStepChange?: (step: string, progress: number) => void;
}

interface TaskStep {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'completed';
}

export default function ExecutionPlan({ tasks, language, activeAgent, activeAction, onStepChange }: ExecutionPlanProps) {
  const [currentStep, setCurrentStep] = useState<string>('');
  const [stepProgress, setStepProgress] = useState(0);
  const [activeTaskId, setActiveTaskId] = useState<string>('');
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  const translations = {
    en: {
      title: 'Execution Plan',
      steps: {
        extraction: ['Connecting to database', 'Fetching financial data', 'Parsing statements'],
        calculation: ['Loading data', 'Computing metrics', 'Validating results'],
        assessment: ['Analyzing patterns', 'Evaluating quality', 'Generating insights'],
      },
      actions: {
        fetching: 'Fetching data...',
        calculating: 'Calculating...',
        analyzing: 'Analyzing...',
        writing: 'Writing code...',
        executing: 'Executing...',
        assessing: 'Assessing...',
        generating: 'Generating insights...'
      }
    },
    ko: {
      title: '실행 계획',
      steps: {
        extraction: ['데이터베이스 연결', '재무 데이터 가져오기', '명세서 파싱'],
        calculation: ['데이터 로드', '지표 계산', '결과 검증'],
        assessment: ['패턴 분석', '품질 평가', '인사이트 생성'],
      },
      actions: {
        fetching: '데이터 가져오는 중...',
        calculating: '계산 중...',
        analyzing: '분석 중...',
        writing: '코드 작성 중...',
        executing: '실행 중...',
        assessing: '평가 중...',
        generating: '인사이트 생성 중...'
      }
    },
  };

  const t = translations[language];

  // Flatten tasks including subtasks
  const flattenTasks = (tasks: Task[]): Task[] => {
    const flattened: Task[] = [];
    tasks.forEach(task => {
      if (task.subtasks && task.subtasks.length > 0) {
        task.subtasks.forEach(subtask => {
          flattened.push(subtask);
        });
      } else {
        flattened.push(task);
      }
    });
    return flattened;
  };

  const flatTasks = flattenTasks(tasks);

  // Update current step for active task
  useEffect(() => {
    const activeTask = flatTasks.find(t => t.status === 'in-progress' || t.status === 'assigned');
    
    if (activeTask && activeTask.id !== activeTaskId) {
      // Clear any existing timeouts
      timeoutRefs.current.forEach(ref => clearTimeout(ref));
      timeoutRefs.current = [];
      
      // Set new active task
      setActiveTaskId(activeTask.id);
      
      const stepNames = t.steps[activeTask.type as keyof typeof t.steps] || t.steps.extraction;
      
      // Set initial step immediately
      setCurrentStep(stepNames[0]);
      setStepProgress(0);
      onStepChange?.(stepNames[0], 0);
      
      // Schedule step 2
      const timeout1 = setTimeout(() => {
        setCurrentStep(stepNames[1]);
        setStepProgress(50);
        onStepChange?.(stepNames[1], 50);
      }, 2000 + Math.random() * 1000); // 2-3 seconds
      
      // Schedule step 3
      const timeout2 = setTimeout(() => {
        setCurrentStep(stepNames[2]);
        setStepProgress(100);
        onStepChange?.(stepNames[2], 100);
      }, 4000 + Math.random() * 2000); // 4-6 seconds total
      
      timeoutRefs.current = [timeout1, timeout2];
      
    } else if (!activeTask && activeTaskId) {
      // Task completed - keep showing last step briefly
      const timeout = setTimeout(() => {
        setActiveTaskId('');
        setCurrentStep('');
        setStepProgress(0);
        onStepChange?.('', 0);
      }, 500);
      
      timeoutRefs.current.push(timeout);
    }
  }, [flatTasks, activeTaskId, t.steps]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(ref => clearTimeout(ref));
    };
  }, []);

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />;
      case 'in-progress':
      case 'assigned':
        return <Clock className="h-3.5 w-3.5 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-3.5 w-3.5 text-red-600" />;
      default:
        return <Circle className="h-3.5 w-3.5 text-gray-400" />;
    }
  };

  const getTaskDescription = (task: Task) => {
    if (task.id.includes('extract-cf')) return 'Cash flow statements';
    if (task.id.includes('extract-is')) return 'Income statements';
    if (task.id.includes('extract-bs')) return 'Balance sheets';
    if (task.id.includes('calc-accruals')) return 'Accruals analysis';
    if (task.id.includes('calc-cfni')) return 'CF/NI ratio';
    if (task.id.includes('calc-mscore')) return 'M-Score calculation';
    if (task.id === 'assess-quality') return 'Overall quality assessment';
    if (task.id === 'generate-report') return 'Generate insights & recommendations';
    return task.description;
  };

  const hasActiveTask = flatTasks.some(t => t.status === 'in-progress' || t.status === 'assigned');

  if (tasks.length === 0) {
    return null;
  }

  return (
    <Card className="p-5 bg-white shadow-lg">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{t.title}</h3>
        </div>

        {/* Simplified linear task list */}
        <div className="space-y-1">
          {flatTasks.map((task, index) => {
            const isActive = task.status === 'in-progress' || task.status === 'assigned';
            
            return (
              <div
                key={task.id}
                className={`flex items-center gap-2 px-3 py-2 transition-all ${
                  isActive
                    ? 'bg-blue-50 border-l-2 border-blue-400'
                    : task.status === 'completed'
                    ? 'opacity-60'
                    : ''
                }`}
              >
                {getStatusIcon(task.status)}
                <span className={`flex-1 text-sm ${
                  task.status === 'completed' ? 'text-gray-500 line-through' :
                  isActive ? 'text-gray-900 font-medium' :
                  'text-gray-600'
                }`}>
                  {getTaskDescription(task)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}