import { 
  Task, 
  QueryAnalysis, 
  ExecutionPlan, 
  AgentMessage,
  AGENT_REGISTRY
} from './types';

export class MasterAgent {
  private messages: AgentMessage[] = [];
  private plan: ExecutionPlan | null = null;
  
  constructor(private onMessage?: (message: AgentMessage) => void) {}

  private emit(message: Omit<AgentMessage, 'id' | 'timestamp'>): void {
    const fullMessage: AgentMessage = {
      ...message,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    
    this.messages.push(fullMessage);
    if (this.onMessage) {
      this.onMessage(fullMessage);
    }
  }

  extractRequirements(query: string): string[] {
    const queryLower = query.toLowerCase();
    const requirements: string[] = [];
    
    if (queryLower.includes('earnings quality')) {
      requirements.push('Comprehensive earnings quality assessment');
    }
    if (queryLower.includes('red flags') || queryLower.includes('accruals')) {
      requirements.push('Accruals analysis and red flag detection');
    }
    if (queryLower.includes('cash flow') || queryLower.includes('net income')) {
      requirements.push('Cash flow to net income comparison');
    }
    if (queryLower.includes('one-time') || queryLower.includes('items')) {
      requirements.push('Identification of one-time items');
    }
    if (queryLower.includes('m-score') || queryLower.includes('beneish')) {
      requirements.push('Beneish M-Score calculation');
    }
    if (queryLower.includes('rating') || queryLower.includes('quality rating')) {
      requirements.push('Overall quality rating generation');
    }
    if (queryLower.includes('concerns') || queryLower.includes('specific concerns')) {
      requirements.push('Specific risk identification');
    }

    return requirements;
  }

  async analyzeQuery(query: string, confirmedRequirements?: string[]): Promise<QueryAnalysis> {
    this.emit({
      from: 'Master Agent',
      type: 'thinking',
      content: 'Analyzing user query to understand requirements...'
    });

    // Skip delay if requirements are already confirmed (planning was done in UI)
    if (!confirmedRequirements) {
      await this.delay(1000 + Math.random() * 500);
    }

    // Use confirmed requirements if provided, otherwise extract from query
    const requirements = confirmedRequirements || this.extractRequirements(query);

    const analysis: QueryAnalysis = {
      intent: 'earnings_quality_analysis',
      requirements,
      entities: {
        company: this.extractCompany(query),
        metrics: this.extractMetrics(query),
        timeframe: this.extractTimeframe(query),
      },
      complexity: requirements.length > 4 ? 'complex' : 
                  requirements.length > 2 ? 'moderate' : 'simple',
      confidence: 0.92
    };

    this.emit({
      from: 'Master Agent',
      type: 'decision',
      content: `Query analysis complete. Identified ${requirements.length} key requirements. Complexity: ${analysis.complexity}`,
      metadata: analysis
    });

    return analysis;
  }

  async createExecutionPlan(query: string, analysis: QueryAnalysis): Promise<ExecutionPlan> {
    this.emit({
      from: 'Master Agent',
      type: 'thinking',
      content: 'Creating execution plan based on requirements...'
    });

    // Skip delay - planning time is simulated in UI
    // await this.delay(1500 + Math.random() * 500);

    // Build task list based on analysis
    const tasks = this.buildTaskList(analysis);
    
    // Determine which agents are needed
    const requiredAgents = this.determineRequiredAgents(tasks);

    const plan: ExecutionPlan = {
      id: Math.random().toString(36).substr(2, 9),
      query,
      analysis,
      tasks,
      agents: requiredAgents,
      estimatedTime: this.estimateExecutionTime(tasks),
      createdAt: Date.now()
    };

    this.plan = plan;

    this.emit({
      from: 'Master Agent',
      type: 'decision',
      content: `Execution plan created: ${tasks.length} tasks, ${requiredAgents.length} specialized agents required`,
      metadata: plan
    });

    // Announce agent assignments without delays (planning time handled in UI)
    for (const agentType of requiredAgents) {
      const agent = AGENT_REGISTRY[agentType];
      if (agent) {
        this.emit({
          from: 'Master Agent',
          type: 'decision',
          content: `Assigning ${agent.name} ${agent.icon} to handle ${agent.capabilities[0].toLowerCase()}`,
        });
      }
    }

    return plan;
  }

  private buildTaskList(analysis: QueryAnalysis): Task[] {
    const tasks: Task[] = [];
    const reqs = analysis.requirements;

    // Only add tasks for confirmed requirements
    if (reqs.some(r => r.includes('earnings quality assessment'))) {
      tasks.push({
        id: 'extract-data',
        title: 'Extract financial data',
        description: 'Pulling financial statements from database',
        type: 'extraction',
        status: 'pending',
        dependencies: []
      });
    }

    if (reqs.some(r => r.includes('Accruals analysis'))) {
      tasks.push({
        id: 'calculate-accruals',
        title: 'Calculate accruals metrics',
        description: 'Computing accruals and ratios',
        type: 'calculation',
        status: 'pending',
        dependencies: ['extract-data']
      });
    }

    if (reqs.some(r => r.includes('Cash flow to net income'))) {
      tasks.push({
        id: 'calculate-cf-ratio',
        title: 'Analyze cash flow ratios',
        description: 'Comparing operating cash flow to net income',
        type: 'calculation',
        status: 'pending',
        dependencies: ['extract-data']
      });
    }

    if (reqs.some(r => r.includes('one-time items'))) {
      tasks.push({
        id: 'identify-onetime',
        title: 'Identify one-time items',
        description: 'Scanning for non-recurring items affecting earnings',
        type: 'extraction',
        status: 'pending',
        dependencies: ['extract-data']
      });
    }

    if (reqs.some(r => r.includes('M-Score'))) {
      tasks.push({
        id: 'calculate-mscore',
        title: 'Calculate Beneish M-Score',
        description: 'Computing earnings manipulation probability',
        type: 'calculation',
        status: 'pending',
        dependencies: ['extract-data']
      });
    }

    if (reqs.some(r => r.includes('quality rating'))) {
      tasks.push({
        id: 'generate-rating',
        title: 'Generate quality rating',
        description: 'Synthesizing overall earnings quality score',
        type: 'assessment',
        status: 'pending',
        dependencies: tasks.filter(t => t.type === 'calculation').map(t => t.id)
      });
    }

    if (reqs.some(r => r.includes('risk identification'))) {
      tasks.push({
        id: 'risk-analysis',
        title: 'Identify specific risks',
        description: 'Analyzing areas of concern and red flags',
        type: 'assessment',
        status: 'pending',
        dependencies: tasks.filter(t => t.type === 'calculation').map(t => t.id)
      });
    }

    // Always add a final validation task if there are other tasks
    if (tasks.length > 0) {
      tasks.push({
        id: 'validate-results',
        title: 'Validate analysis',
        description: 'Cross-checking results for accuracy',
        type: 'assessment',
        status: 'pending',
        dependencies: tasks.map(t => t.id)
      });
      
      // Add final report generation task
      tasks.push({
        id: 'generate-report',
        title: 'Generate report',
        description: 'Creating comprehensive analysis report',
        type: 'report',
        status: 'pending',
        dependencies: ['validate-results']
      });
    }

    return tasks;
  }

  private determineRequiredAgents(tasks: Task[]): string[] {
    const agents = new Set<string>();
    
    tasks.forEach(task => {
      switch (task.type) {
        case 'extraction':
          agents.add('data-extraction');
          break;
        case 'calculation':
          agents.add('calculation');
          break;
        case 'assessment':
          agents.add('assessment');
          break;
        case 'report':
          agents.add('report');
          break;
      }
      
      // Check subtasks
      task.subtasks?.forEach(subtask => {
        switch (subtask.type) {
          case 'extraction':
            agents.add('data-extraction');
            break;
          case 'calculation':
            agents.add('calculation');
            break;
          case 'assessment':
            agents.add('assessment');
            break;
          case 'report':
            agents.add('report');
            break;
        }
      });
    });

    // Always add validation for complex queries
    if (tasks.length > 5) {
      agents.add('validation');
    }

    return Array.from(agents);
  }

  private estimateExecutionTime(tasks: Task[]): number {
    // Base time per task type (in ms)
    const timePerTask = {
      analysis: 500,
      extraction: 1000,
      calculation: 300,
      assessment: 200,
      report: 400
    };

    let totalTime = 0;
    tasks.forEach(task => {
      totalTime += timePerTask[task.type] || 500;
      if (task.subtasks) {
        task.subtasks.forEach(st => {
          totalTime += timePerTask[st.type] || 300;
        });
      }
    });

    return totalTime;
  }

  private extractCompany(query: string): string {
    if (query.toLowerCase().includes('samsung')) return 'Samsung Electronics';
    if (query.toLowerCase().includes('apple')) return 'Apple Inc.';
    // Add more company extraction logic
    return 'Unknown Company';
  }

  private extractMetrics(query: string): string[] {
    const metrics: string[] = [];
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('accrual')) metrics.push('accruals');
    if (queryLower.includes('cash flow')) metrics.push('cash_flow');
    if (queryLower.includes('net income')) metrics.push('net_income');
    if (queryLower.includes('m-score')) metrics.push('m_score');
    if (queryLower.includes('revenue')) metrics.push('revenue');
    if (queryLower.includes('profit')) metrics.push('profit');
    
    return metrics;
  }

  private extractTimeframe(query: string): string {
    if (query.includes('quarterly')) return 'quarterly';
    if (query.includes('annual')) return 'annual';
    if (query.includes('latest')) return 'latest';
    return 'latest';
  }

  updateTaskStatus(taskId: string, status: Task['status'], assignedAgent?: string): void {
    if (!this.plan) return;

    const updateTask = (tasks: Task[]): boolean => {
      for (const task of tasks) {
        if (task.id === taskId) {
          task.status = status;
          if (assignedAgent) task.assignedAgent = assignedAgent;
          if (status === 'in-progress') task.startTime = Date.now();
          if (status === 'completed') task.endTime = Date.now();
          return true;
        }
        if (task.subtasks && updateTask(task.subtasks)) {
          return true;
        }
      }
      return false;
    };

    updateTask(this.plan.tasks);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getMessages(): AgentMessage[] {
    return this.messages;
  }

  getPlan(): ExecutionPlan | null {
    return this.plan;
  }
}