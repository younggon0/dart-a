// Agent and Task Type Definitions

export type AgentType = 
  | 'master'
  | 'data-extraction'
  | 'calculation'
  | 'assessment'
  | 'validation'
  | 'synthesis'
  | 'report';

export type TaskStatus = 
  | 'pending'
  | 'assigned'
  | 'in-progress'
  | 'completed'
  | 'failed';

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'analysis' | 'extraction' | 'calculation' | 'assessment' | 'report';
  status: TaskStatus;
  assignedAgent?: string;
  dependencies: string[];
  subtasks?: Task[];
  result?: any;
  startTime?: number;
  endTime?: number;
  confidence?: number;
}

export interface AgentCapability {
  name: string;
  type: AgentType;
  capabilities: string[];
  description: string;
  icon?: string;
}

export interface AgentMessage {
  id: string;
  from: string;
  to?: string;
  type: 'thinking' | 'decision' | 'status' | 'result' | 'error';
  content: string;
  timestamp: number;
  metadata?: any;
}

export interface QueryAnalysis {
  intent: string;
  requirements: string[];
  entities: {
    company?: string;
    metrics?: string[];
    timeframe?: string;
  };
  complexity: 'simple' | 'moderate' | 'complex';
  confidence: number;
}

export interface ExecutionPlan {
  id: string;
  query: string;
  analysis: QueryAnalysis;
  tasks: Task[];
  agents: string[];
  estimatedTime: number;
  createdAt: number;
}

// Agent Registry
export const AGENT_REGISTRY: Record<string, AgentCapability> = {
  'data-extraction': {
    name: 'Data Extraction Agent',
    type: 'data-extraction',
    capabilities: [
      'Extract financial statements',
      'Parse cash flow data',
      'Read income statements',
      'Analyze balance sheets',
      'Handle Korean/English data'
    ],
    description: 'Specializes in extracting and parsing financial data from various sources',
    icon: '📊'
  },
  'calculation': {
    name: 'Calculation Agent',
    type: 'calculation',
    capabilities: [
      'Calculate financial ratios',
      'Compute accruals',
      'Calculate M-Score',
      'Perform trend analysis',
      'Statistical analysis'
    ],
    description: 'Performs complex financial calculations and statistical analysis',
    icon: '🧮'
  },
  'assessment': {
    name: 'Quality Assessment Agent',
    type: 'assessment',
    capabilities: [
      'Evaluate earnings quality',
      'Apply thresholds',
      'Generate risk scores',
      'Create alerts',
      'Benchmark comparisons'
    ],
    description: 'Assesses financial health and generates quality ratings',
    icon: '✅'
  },
  'validation': {
    name: 'Validation Agent',
    type: 'validation',
    capabilities: [
      'Cross-check calculations',
      'Verify data integrity',
      'Validate assumptions',
      'Check for anomalies'
    ],
    description: 'Ensures accuracy and consistency of analysis',
    icon: '🔍'
  },
  'synthesis': {
    name: 'Synthesis Agent',
    type: 'synthesis',
    capabilities: [
      'Combine results',
      'Generate insights',
      'Create visualizations',
      'Prepare reports'
    ],
    description: 'Synthesizes findings into actionable insights',
    icon: '📝'
  },
  'report': {
    name: 'Report Agent',
    type: 'report',
    capabilities: [
      'Generate comprehensive reports',
      'Format analysis results',
      'Create executive summaries',
      'Export to various formats'
    ],
    description: 'Creates detailed analysis reports with insights and recommendations',
    icon: '📄'
  }
};

// Task Templates
export const TASK_TEMPLATES = {
  earningsQuality: [
    {
      id: 'extract-data',
      title: 'Extract financial data',
      type: 'extraction' as const,
      description: 'Gathering necessary financial statements',
      subtasks: [
        { 
          id: 'extract-cf', 
          title: 'Extract cash flow statements',
          type: 'extraction' as const,
          description: 'Locating and parsing cash flow data'
        },
        { 
          id: 'extract-is', 
          title: 'Extract income statements',
          type: 'extraction' as const,
          description: 'Finding revenue and profit information'
        },
        { 
          id: 'extract-bs', 
          title: 'Extract balance sheets',
          type: 'extraction' as const,
          description: 'Retrieving asset and liability data'
        }
      ]
    },
    {
      id: 'calculate-metrics',
      title: 'Calculate financial metrics',
      type: 'calculation' as const,
      description: 'Computing key financial indicators',
      dependencies: ['extract-data'],
      subtasks: [
        { 
          id: 'calc-accruals', 
          title: 'Calculate accruals',
          type: 'calculation' as const,
          description: 'Computing total accruals and ratios'
        },
        { 
          id: 'calc-cfni', 
          title: 'Calculate CF/NI ratio',
          type: 'calculation' as const,
          description: 'Analyzing cash flow quality'
        },
        { 
          id: 'calc-mscore', 
          title: 'Calculate M-Score',
          type: 'calculation' as const,
          description: 'Computing manipulation probability'
        }
      ]
    },
    {
      id: 'assess-quality',
      title: 'Assess earnings quality',
      type: 'assessment' as const,
      description: 'Evaluating overall financial health',
      dependencies: ['calculate-metrics']
    },
    {
      id: 'generate-report',
      title: 'Generate final report',
      type: 'assessment' as const,
      description: 'Synthesizing findings and recommendations',
      dependencies: ['assess-quality']
    }
  ]
};