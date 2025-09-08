'use client';

import { Card } from '@/components/ui/card';
import { CheckCircle2, Circle, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { Task, AGENT_REGISTRY } from '@/lib/agents/types';

interface TaskPlannerViewProps {
  tasks: Task[];
  language: 'en' | 'ko';
}

export default function TaskPlannerView({ tasks, language }: TaskPlannerViewProps) {
  const translations = {
    en: {
      title: 'Execution Plan',
      assigned: 'Assigned to',
      pending: 'Pending',
      inProgress: 'In Progress',
      completed: 'Completed',
      failed: 'Failed',
      dependencies: 'Dependencies',
      subtasks: 'Subtasks',
    },
    ko: {
      title: '실행 계획',
      assigned: '할당됨',
      pending: '대기 중',
      inProgress: '진행 중',
      completed: '완료',
      failed: '실패',
      dependencies: '종속성',
      subtasks: '하위 작업',
    },
  };

  const t = translations[language];

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'assigned':
        return <Circle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'in-progress':
        return 'bg-blue-50 border-blue-200 animate-pulse';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'assigned':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getAgentInfo = (agentId?: string) => {
    if (!agentId) return null;
    const agent = AGENT_REGISTRY[agentId];
    return agent ? `${agent.icon} ${agent.name}` : agentId;
  };

  const renderTask = (task: Task, level: number = 0) => (
    <div key={task.id} className={`${level > 0 ? 'ml-6' : ''}`}>
      <div className={`rounded-lg border p-3 mb-2 transition-all ${getStatusColor(task.status)}`}>
        <div className="flex items-start gap-3">
          {getStatusIcon(task.status)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm text-gray-900">{task.title}</h4>
              {task.confidence && (
                <span className="text-xs text-gray-500">
                  ({Math.round(task.confidence * 100)}% confidence)
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 mt-0.5">{task.description}</p>
            
            {/* Metadata */}
            <div className="flex flex-wrap gap-2 mt-2">
              {task.assignedAgent && (
                <span className="text-xs px-2 py-1 bg-white rounded-md border border-gray-200">
                  {t.assigned}: {getAgentInfo(task.assignedAgent)}
                </span>
              )}
              {task.dependencies.length > 0 && (
                <span className="text-xs px-2 py-1 bg-white rounded-md border border-gray-200">
                  {t.dependencies}: {task.dependencies.join(', ')}
                </span>
              )}
              {task.startTime && task.endTime && (
                <span className="text-xs px-2 py-1 bg-white rounded-md border border-gray-200">
                  {((task.endTime - task.startTime) / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          </div>
          
          {/* Expand indicator for subtasks */}
          {task.subtasks && task.subtasks.length > 0 && (
            <ChevronRight className="h-4 w-4 text-gray-400 transform rotate-90" />
          )}
        </div>
      </div>
      
      {/* Render subtasks */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="relative">
          {/* Connection line */}
          <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          {task.subtasks.map((subtask, index) => (
            <div key={subtask.id} className="relative">
              {/* Horizontal connector */}
              <div className="absolute left-2 top-6 w-4 h-0.5 bg-gray-200"></div>
              {renderTask(subtask, level + 1)}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (tasks.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 bg-white">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{t.title}</h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <Circle className="h-3 w-3 text-gray-400" />
              <span className="text-gray-500">{t.pending}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-blue-600" />
              <span className="text-gray-500">{t.inProgress}</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <span className="text-gray-500">{t.completed}</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          {tasks.map(task => renderTask(task))}
        </div>
      </div>
    </Card>
  );
}