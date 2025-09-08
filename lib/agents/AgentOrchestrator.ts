import { MasterAgent } from './MasterAgent';
import { DataExtractionAgent } from './DataExtractionAgent';
import { CalculationAgent } from './CalculationAgent';
import { QualityAssessmentAgent } from './QualityAssessmentAgent';
import { 
  Task, 
  AgentMessage, 
  ExecutionPlan,
  QueryAnalysis 
} from './types';

export interface OrchestratorCallbacks {
  onMessage?: (message: AgentMessage) => void;
  onTaskUpdate?: (task: Task) => void;
  onPlanUpdate?: (plan: ExecutionPlan) => void;
  onAnalysisComplete?: (analysis: QueryAnalysis) => void;
}

export class AgentOrchestrator {
  private masterAgent: MasterAgent;
  private callbacks: OrchestratorCallbacks;
  private executionPlan?: ExecutionPlan;
  
  constructor(callbacks: OrchestratorCallbacks = {}) {
    this.callbacks = callbacks;
    this.masterAgent = new MasterAgent((message) => {
      this.callbacks.onMessage?.(message);
    });
  }

  async executeQuery(query: string, corpCode: string, confirmedRequirements?: string[]) {
    // Step 1: Master agent analyzes the query with confirmed requirements
    const analysis = await this.masterAgent.analyzeQuery(query, confirmedRequirements);
    this.callbacks.onAnalysisComplete?.(analysis);
    
    // Step 2: Create execution plan
    const plan = await this.masterAgent.createExecutionPlan(query, analysis);
    this.executionPlan = plan;
    this.callbacks.onPlanUpdate?.(plan);
    
    // Add a tiny delay before starting execution to allow UI to update
    await this.delay(100);
    
    // Step 3: Execute tasks sequentially with dynamic updates
    const results: any = {};
    
    for (const task of plan.tasks) {
      await this.executeTask(task, corpCode, results);
    }
    
    return {
      analysis,
      plan,
      results,
      messages: this.masterAgent.getMessages()
    };
  }

  private async executeTask(task: Task, corpCode: string, results: any) {
    // Update task status to assigned with random delay
    this.updateTaskStatus(task.id, 'assigned');
    await this.delay(300 + Math.random() * 200); // 300-500ms
    
    // Determine which agent to use
    let agentType = '';
    switch (task.type) {
      case 'extraction':
        agentType = 'data-extraction';
        break;
      case 'calculation':
        agentType = 'calculation';
        break;
      case 'assessment':
        agentType = 'assessment';
        break;
      default:
        agentType = 'master';
    }
    
    // Update task with assigned agent
    this.updateTaskStatus(task.id, 'in-progress', agentType);
    
    // Emit agent message
    this.emitAgentMessage({
      from: this.getAgentName(agentType),
      type: 'status',
      content: `Starting task: ${task.title}`
    });
    
    // Random delay for task start
    await this.delay(500 + Math.random() * 500); // 500-1000ms
    
    // Execute based on task type
    try {
      if (task.type === 'extraction') {
        // Execute extraction tasks
        if (task.subtasks) {
          for (const subtask of task.subtasks) {
            await this.executeSubtask(subtask, corpCode, results, agentType);
          }
        } else {
          await this.performExtraction(task, corpCode, results);
        }
      } else if (task.type === 'calculation') {
        // Execute calculation tasks
        if (task.subtasks) {
          for (const subtask of task.subtasks) {
            await this.executeSubtask(subtask, corpCode, results, agentType);
          }
        } else {
          await this.performCalculation(task, results);
        }
      } else if (task.type === 'assessment') {
        // Execute assessment
        await this.performAssessment(task, results);
      } else {
        // Generic task execution with random delay
        await this.delay(800 + Math.random() * 400); // 800-1200ms
      }
      
      // Mark task as completed
      this.updateTaskStatus(task.id, 'completed');
      
      this.emitAgentMessage({
        from: this.getAgentName(agentType),
        type: 'result',
        content: `Completed: ${task.title}`
      });
      
    } catch (error) {
      this.updateTaskStatus(task.id, 'failed');
      this.emitAgentMessage({
        from: this.getAgentName(agentType),
        type: 'error',
        content: `Failed: ${task.title} - ${error}`
      });
    }
  }

  private async executeSubtask(subtask: Task, corpCode: string, results: any, parentAgent: string) {
    this.updateTaskStatus(subtask.id, 'in-progress', parentAgent);
    
    this.emitAgentMessage({
      from: this.getAgentName(parentAgent),
      type: 'status',
      content: `Processing: ${subtask.title}`
    });
    
    // Longer delay for subtask to match step progression (4-7 seconds total)
    await this.delay(1500 + Math.random() * 1000); // Initial delay
    
    // Simulate subtask execution
    if (subtask.type === 'extraction') {
      await this.performExtraction(subtask, corpCode, results);
    } else if (subtask.type === 'calculation') {
      await this.performCalculation(subtask, results);
    }
    
    this.updateTaskStatus(subtask.id, 'completed');
  }

  private async performExtraction(task: Task, corpCode: string, results: any) {
    const agent = new DataExtractionAgent(corpCode);
    
    this.emitAgentMessage({
      from: 'Data Extraction Agent',
      type: 'thinking',
      content: 'Querying financial database...'
    });
    
    // Update task with 'fetching' action
    this.updateTaskAction(task.id, 'fetching');
    
    // Longer delays to match 3 steps (total ~6-9 seconds)
    await this.delay(2000 + Math.random() * 1000); // Step 1: Connecting (2-3s)
    await this.delay(2000 + Math.random() * 1000); // Step 2: Fetching (2-3s)
    const data = await agent.extract();
    await this.delay(2000 + Math.random() * 1000); // Step 3: Parsing (2-3s)
    results.extractedData = data;
    
    this.emitAgentMessage({
      from: 'Data Extraction Agent',
      type: 'result',
      content: `Found ${data.rawTables.length} relevant tables`
    });
  }

  private async performCalculation(task: Task, results: any) {
    if (!results.extractedData) {
      throw new Error('No data available for calculation');
    }
    
    const agent = new CalculationAgent(results.extractedData);
    
    this.emitAgentMessage({
      from: 'Calculation Agent',
      type: 'thinking',
      content: 'Computing financial metrics...'
    });
    
    // Update task with 'calculating' action
    this.updateTaskAction(task.id, 'calculating');
    
    // Longer delays to match 3 steps (total ~6-9 seconds)
    await this.delay(2000 + Math.random() * 1000); // Step 1: Loading data (2-3s)
    await this.delay(2000 + Math.random() * 1000); // Step 2: Computing (2-3s)
    const metrics = agent.calculate();
    await this.delay(2000 + Math.random() * 1000); // Step 3: Validating (2-3s)
    results.calculatedMetrics = metrics;
    
    this.emitAgentMessage({
      from: 'Calculation Agent',
      type: 'result',
      content: `Calculated: Accruals ratio ${(metrics.accrualsRatio * 100).toFixed(2)}%, M-Score ${metrics.mScore.toFixed(2)}`
    });
  }

  private async performAssessment(task: Task, results: any) {
    if (!results.calculatedMetrics) {
      throw new Error('No metrics available for assessment');
    }
    
    const agent = new QualityAssessmentAgent(results.calculatedMetrics);
    
    this.emitAgentMessage({
      from: 'Quality Assessment Agent',
      type: 'thinking',
      content: 'Evaluating earnings quality...'
    });
    
    // Update task with 'assessing' action
    this.updateTaskAction(task.id, 'assessing');
    
    // Longer delays to match 3 steps (total ~6-9 seconds)
    await this.delay(2000 + Math.random() * 1000); // Step 1: Analyzing patterns (2-3s)
    await this.delay(2000 + Math.random() * 1000); // Step 2: Evaluating (2-3s)
    const assessment = agent.assess();
    await this.delay(2000 + Math.random() * 1000); // Step 3: Generating insights (2-3s)
    results.assessment = assessment;
    
    this.emitAgentMessage({
      from: 'Quality Assessment Agent',
      type: 'result',
      content: `Assessment complete: ${assessment.rating.grade} (${assessment.rating.score}/100)`
    });
  }

  private updateTaskStatus(taskId: string, status: Task['status'], assignedAgent?: string) {
    this.masterAgent.updateTaskStatus(taskId, status, assignedAgent);
    
    if (this.executionPlan) {
      const findAndUpdateTask = (tasks: Task[]): Task | undefined => {
        for (const task of tasks) {
          if (task.id === taskId) {
            task.status = status;
            if (assignedAgent) task.assignedAgent = assignedAgent;
            if (status === 'in-progress') task.startTime = Date.now();
            if (status === 'completed') task.endTime = Date.now();
            return task;
          }
          if (task.subtasks) {
            const found = findAndUpdateTask(task.subtasks);
            if (found) return found;
          }
        }
      };
      
      const updatedTask = findAndUpdateTask(this.executionPlan.tasks);
      if (updatedTask) {
        this.callbacks.onTaskUpdate?.(updatedTask);
        this.callbacks.onPlanUpdate?.(this.executionPlan);
      }
    }
  }

  private emitAgentMessage(message: Omit<AgentMessage, 'id' | 'timestamp'>) {
    const fullMessage: AgentMessage = {
      ...message,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    this.callbacks.onMessage?.(fullMessage);
  }

  private getAgentName(type: string): string {
    const names: Record<string, string> = {
      'data-extraction': 'Data Extraction Agent',
      'calculation': 'Calculation Agent',
      'assessment': 'Quality Assessment Agent',
      'validation': 'Validation Agent',
      'master': 'Master Agent'
    };
    return names[type] || type;
  }

  private updateTaskAction(taskId: string, action: string) {
    // This is just to track the action type, actual task update happens through updateTaskStatus
    // We can emit a special message to track action if needed
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}