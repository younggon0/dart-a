import { 
  Task, 
  QueryAnalysis, 
  ExecutionPlan, 
  AgentMessage,
  AGENT_REGISTRY,
  TASK_TEMPLATES
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

  async analyzeQuery(query: string): Promise<QueryAnalysis> {
    this.emit({
      from: 'Master Agent',
      type: 'thinking',
      content: 'Analyzing user query to understand requirements...'
    });

    // Simulate analysis delay
    await this.delay(800);

    // Parse the query for key components
    const queryLower = query.toLowerCase();
    
    // Extract requirements based on keywords
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

    await this.delay(600);

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

    // Announce agent assignments
    for (const agentType of requiredAgents) {
      const agent = AGENT_REGISTRY[agentType];
      if (agent) {
        await this.delay(300);
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
    const baseTasks = TASK_TEMPLATES.earningsQuality.map(template => ({
      ...template,
      status: 'pending' as const,
      dependencies: template.dependencies || [],
      subtasks: template.subtasks?.map(st => ({
        ...st,
        status: 'pending' as const,
        dependencies: []
      }))
    }));

    // Add additional tasks based on specific requirements
    if (analysis.requirements.some(r => r.includes('one-time items'))) {
      baseTasks.push({
        id: 'identify-onetime',
        title: 'Identify one-time items',
        description: 'Scanning for non-recurring items affecting earnings',
        type: 'extraction',
        status: 'pending',
        dependencies: ['extract-data']
      });
    }

    if (analysis.requirements.some(r => r.includes('risk identification'))) {
      baseTasks.push({
        id: 'risk-analysis',
        title: 'Perform risk analysis',
        description: 'Identifying specific areas of concern',
        type: 'assessment',
        status: 'pending',
        dependencies: ['calculate-metrics']
      });
    }

    return baseTasks;
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
      assessment: 200
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