'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Task } from '@/lib/agents/types';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  ChevronRight,
  Loader2,
  Database,
  Calculator,
  FileSearch,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UnifiedExecutionViewProps {
  tasks: Task[];
  language: 'en' | 'ko';
  activeAgent?: string;
  activeAction?: string;
}

interface AgentInfo {
  name: string;
  icon: JSX.Element;
  color: string;
}

const AGENT_MAP: Record<string, AgentInfo> = {
  'data-extraction': {
    name: 'Data Extraction Agent',
    icon: <Database className="h-4 w-4" />,
    color: 'blue'
  },
  'calculation': {
    name: 'Calculation Agent',
    icon: <Calculator className="h-4 w-4" />,
    color: 'purple'
  },
  'assessment': {
    name: 'Quality Assessment Agent',
    icon: <FileSearch className="h-4 w-4" />,
    color: 'green'
  },
  'validation': {
    name: 'Validation Agent',
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'orange'
  }
};

const STEP_SEQUENCES: Record<string, string[]> = {
  'extraction': ['Fetching data', 'Parsing records', 'Validating data'],
  'calculation': ['Loading formulas', 'Computing metrics', 'Verifying results'],
  'assessment': ['Analyzing patterns', 'Applying rules', 'Generating insights']
};

export default function UnifiedExecutionView({ 
  tasks, 
  language, 
  activeAgent,
  activeAction 
}: UnifiedExecutionViewProps) {
  const [currentSteps, setCurrentSteps] = useState<Record<string, number>>({});
  const [completedSteps, setCompletedSteps] = useState<Record<string, number>>({});
  const stepTimeoutsRef = useRef<Record<string, NodeJS.Timeout[]>>({});

  useEffect(() => {
    // Find the active task
    const activeTask = tasks.find(t => t.status === 'in-progress');
    
    if (activeTask && activeTask.assignedAgent) {
      const taskKey = activeTask.id;
      
      // Initialize steps for this task if not already done
      if (!(taskKey in currentSteps)) {
        setCurrentSteps(prev => ({ ...prev, [taskKey]: 0 }));
        setCompletedSteps(prev => ({ ...prev, [taskKey]: 0 }));
        
        // Clear any existing timeouts for this task
        if (stepTimeoutsRef.current[taskKey]) {
          stepTimeoutsRef.current[taskKey].forEach(t => clearTimeout(t));
        }
        
        // Schedule step progressions
        const steps = STEP_SEQUENCES[activeTask.type] || ['Processing', 'Analyzing', 'Completing'];
        const timeouts: NodeJS.Timeout[] = [];
        
        // Progress through steps
        steps.forEach((_, index) => {
          const delay = (index + 1) * (2000 + Math.random() * 1000); // 2-3s per step
          const timeout = setTimeout(() => {
            setCurrentSteps(prev => ({ ...prev, [taskKey]: index }));
            if (index > 0) {
              setCompletedSteps(prev => ({ ...prev, [taskKey]: index }));
            }
          }, delay);
          timeouts.push(timeout);
        });
        
        stepTimeoutsRef.current[taskKey] = timeouts;
      }
    }
    
    // Clean up completed tasks
    tasks.filter(t => t.status === 'completed').forEach(task => {
      if (stepTimeoutsRef.current[task.id]) {
        stepTimeoutsRef.current[task.id].forEach(t => clearTimeout(t));
        delete stepTimeoutsRef.current[task.id];
      }
    });
    
    return () => {
      // Cleanup all timeouts on unmount
      Object.values(stepTimeoutsRef.current).flat().forEach(t => clearTimeout(t));
    };
  }, [tasks, currentSteps]);

  const translations = {
    en: {
      title: 'Execution Plan',
      pending: 'Pending',
      inProgress: 'In Progress',
      completed: 'Completed',
      estimatedTime: 'Estimated time',
      step: 'Step'
    },
    ko: {
      title: '실행 계획',
      pending: '대기 중',
      inProgress: '진행 중',
      completed: '완료',
      estimatedTime: '예상 시간',
      step: '단계'
    }
  };

  const t = translations[language];

  const getTaskIcon = (task: Task) => {
    if (task.status === 'completed') {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else if (task.status === 'in-progress') {
      return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
    } else {
      return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getTaskStyle = (task: Task) => {
    if (task.status === 'completed') {
      return 'bg-green-50 border-green-200';
    } else if (task.status === 'in-progress') {
      return 'bg-blue-50 border-blue-300 shadow-md';
    } else {
      return 'bg-gray-50 border-gray-200';
    }
  };

  const renderAgentStatus = (task: Task) => {
    if (task.status !== 'in-progress' || !task.assignedAgent) return null;
    
    const agent = AGENT_MAP[task.assignedAgent];
    if (!agent) return null;
    
    const steps = STEP_SEQUENCES[task.type] || ['Processing', 'Analyzing', 'Completing'];
    const currentStep = currentSteps[task.id] || 0;
    
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="mt-3 pt-3 border-t border-gray-200"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-1 rounded bg-${agent.color}-100`}>
            {agent.icon}
          </div>
          <span className="text-sm font-medium text-gray-700">{agent.name}</span>
        </div>
        
        <div className="space-y-1 ml-6">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-2">
              {index < currentStep ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : index === currentStep ? (
                <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />
              ) : (
                <Circle className="h-3 w-3 text-gray-300" />
              )}
              <span className={`text-xs ${
                index <= currentStep ? 'text-gray-700' : 'text-gray-400'
              }`}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  return (
    <Card className="p-6 bg-white shadow-lg">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t.title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {tasks.filter(t => t.status === 'completed').length} / {tasks.length} tasks completed
          </p>
        </div>

        <div className="space-y-2">
          <AnimatePresence mode="sync">
            {tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className={`p-4 rounded-lg border transition-all ${getTaskStyle(task)}`}>
                  <div className="flex items-start gap-3">
                    {getTaskIcon(task)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">
                          {task.title}
                        </h4>
                        {task.status === 'pending' && (
                          <span className="text-xs text-gray-500">{t.pending}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                      
                      {/* Agent status for active task */}
                      <AnimatePresence>
                        {renderAgentStatus(task)}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
}