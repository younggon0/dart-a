'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Clock, AlertCircle, Database, Calculator, TrendingUp, Brain } from 'lucide-react';
import { Task, AGENT_REGISTRY } from '@/lib/agents/types';

interface TaskPlannerViewProps {
  tasks: Task[];
  language: 'en' | 'ko';
}

interface AgentGroup {
  agentId: string;
  agentName: string;
  icon: string;
  tasks: Task[];
  overallStatus: 'pending' | 'in-progress' | 'completed';
}

export default function TaskPlannerView({ tasks, language }: TaskPlannerViewProps) {
  const translations = {
    en: {
      title: 'Execution Plan',
      pending: 'Pending',
      inProgress: 'Working',
      completed: 'Completed',
      failed: 'Failed',
      tasks: 'tasks',
      dataExtraction: 'Data Extraction',
      calculation: 'Calculation',
      assessment: 'Assessment',
    },
    ko: {
      title: '실행 계획',
      pending: '대기 중',
      inProgress: '작업 중',
      completed: '완료',
      failed: '실패',
      tasks: '작업',
      dataExtraction: '데이터 추출',
      calculation: '계산',
      assessment: '평가',
    },
  };

  const t = translations[language];

  // Group tasks by agent
  const groupTasksByAgent = (tasks: Task[]): AgentGroup[] => {
    const groups: Record<string, AgentGroup> = {};
    
    // Flatten and group tasks
    const flattenTasks = (tasks: Task[]): Task[] => {
      const flattened: Task[] = [];
      tasks.forEach(task => {
        if (task.id === 'analyze-query') return;
        
        if (task.subtasks && task.subtasks.length > 0) {
          task.subtasks.forEach(subtask => {
            flattened.push({
              ...subtask,
              assignedAgent: subtask.assignedAgent || task.assignedAgent || getAgentForTaskType(subtask.type)
            });
          });
        } else {
          flattened.push({
            ...task,
            assignedAgent: task.assignedAgent || getAgentForTaskType(task.type)
          });
        }
      });
      return flattened;
    };
    
    const flatTasks = flattenTasks(tasks);
    
    flatTasks.forEach(task => {
      const agentId = task.assignedAgent || 'unknown';
      
      if (!groups[agentId]) {
        const agentInfo = AGENT_REGISTRY[agentId];
        groups[agentId] = {
          agentId,
          agentName: agentInfo?.name || agentId,
          icon: agentInfo?.icon || '🤖',
          tasks: [],
          overallStatus: 'pending'
        };
      }
      
      groups[agentId].tasks.push(task);
    });
    
    // Update overall status for each group
    Object.values(groups).forEach(group => {
      if (group.tasks.every(t => t.status === 'completed')) {
        group.overallStatus = 'completed';
      } else if (group.tasks.some(t => t.status === 'in-progress' || t.status === 'assigned')) {
        group.overallStatus = 'in-progress';
      }
    });
    
    // Order groups by execution sequence
    const orderedGroups: AgentGroup[] = [];
    const extractionGroup = groups['data-extraction'];
    const calculationGroup = groups['calculation'];
    const assessmentGroup = groups['assessment'];
    
    if (extractionGroup) orderedGroups.push(extractionGroup);
    if (calculationGroup) orderedGroups.push(calculationGroup);
    if (assessmentGroup) orderedGroups.push(assessmentGroup);
    
    // Add any remaining groups
    Object.values(groups).forEach(group => {
      if (!orderedGroups.find(g => g.agentId === group.agentId)) {
        orderedGroups.push(group);
      }
    });
    
    return orderedGroups;
  };

  const getAgentForTaskType = (type: Task['type']): string => {
    switch (type) {
      case 'extraction': return 'data-extraction';
      case 'calculation': return 'calculation';
      case 'assessment': return 'assessment';
      default: return 'master';
    }
  };

  const getAgentIcon = (agentId: string) => {
    switch (agentId) {
      case 'data-extraction': return <Database className="h-5 w-5" />;
      case 'calculation': return <Calculator className="h-5 w-5" />;
      case 'assessment': return <TrendingUp className="h-5 w-5" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in-progress':
      case 'assigned':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getGroupStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'in-progress':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
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

  const agentGroups = groupTasksByAgent(tasks);

  if (tasks.length === 0) {
    return null;
  }

  return (
    <Card className="p-5 bg-white shadow-lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{t.title}</h3>
          <div className="flex items-center gap-3 text-xs">
            <Badge variant="outline" className="gap-1">
              <Circle className="h-3 w-3" />
              {t.pending}
            </Badge>
            <Badge variant="outline" className="gap-1 text-blue-600 border-blue-200 bg-blue-50">
              <Clock className="h-3 w-3 animate-spin" />
              {t.inProgress}
            </Badge>
            <Badge variant="outline" className="gap-1 text-green-600 border-green-200 bg-green-50">
              <CheckCircle2 className="h-3 w-3" />
              {t.completed}
            </Badge>
          </div>
        </div>
        
        {/* Agent Groups */}
        <div className="space-y-3">
          {agentGroups.map((group, index) => (
            <div 
              key={group.agentId}
              className={`rounded-lg border-2 transition-all ${getGroupStatusStyle(group.overallStatus)}`}
            >
              {/* Agent Header */}
              <div className="px-4 py-3 border-b bg-white/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      group.overallStatus === 'in-progress' ? 'bg-blue-100 animate-pulse' : 
                      group.overallStatus === 'completed' ? 'bg-green-100' : 
                      'bg-gray-100'
                    }`}>
                      {getAgentIcon(group.agentId)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {group.icon} {group.agentName}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {group.tasks.length} {t.tasks}
                      </p>
                    </div>
                  </div>
                  {group.overallStatus === 'completed' && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                  {group.overallStatus === 'in-progress' && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-blue-600 font-medium">{t.inProgress}</span>
                      <Clock className="h-4 w-4 text-blue-600 animate-spin" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Tasks List */}
              <div className="p-3 space-y-2">
                {group.tasks.map((task, taskIndex) => (
                  <div 
                    key={task.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all ${
                      task.status === 'in-progress' || task.status === 'assigned' 
                        ? 'bg-white border border-blue-200 shadow-sm' 
                        : task.status === 'completed'
                        ? 'bg-white/70'
                        : 'bg-white/30'
                    }`}
                  >
                    {getStatusIcon(task.status)}
                    <span className={`text-sm ${
                      task.status === 'completed' ? 'text-gray-600' : 
                      task.status === 'in-progress' || task.status === 'assigned' ? 'text-gray-900 font-medium' : 
                      'text-gray-500'
                    }`}>
                      {getTaskDescription(task)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Progress indicator */}
        {agentGroups.length > 0 && (
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex gap-2">
              {agentGroups.map((group, index) => (
                <div
                  key={group.agentId}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    group.overallStatus === 'completed' ? 'bg-green-500' :
                    group.overallStatus === 'in-progress' ? 'bg-blue-500 animate-pulse' :
                    'bg-gray-200'
                  }`}
                  style={{ width: `${100 / agentGroups.length}%` }}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 ml-3">
              {agentGroups.filter(g => g.overallStatus === 'completed').length} / {agentGroups.length} agents complete
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}