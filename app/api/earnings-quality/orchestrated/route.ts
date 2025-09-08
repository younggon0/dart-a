import { NextRequest, NextResponse } from 'next/server';
import { AgentOrchestrator } from '@/lib/agents/AgentOrchestrator';

export interface OrchestratedRequest {
  corpCode: string;
  query: string;
  language: 'en' | 'ko';
  confirmedRequirements?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: OrchestratedRequest = await request.json();
    
    if (!body.corpCode || !body.query) {
      return NextResponse.json(
        { status: 'error', error: 'Corp code and query are required' },
        { status: 400 }
      );
    }

    // Create a TransformStream for Server-Sent Events
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Function to send SSE events
    const sendEvent = (type: string, data: any) => {
      const event = `data: ${JSON.stringify({ type, data })}\n\n`;
      writer.write(encoder.encode(event));
    };

    // Start orchestration in background
    (async () => {
      try {
        const orchestrator = new AgentOrchestrator({
          onMessage: (message) => {
            sendEvent('message', message);
          },
          onTaskUpdate: (task) => {
            sendEvent('task_update', task);
          },
          onPlanUpdate: (plan) => {
            sendEvent('plan', plan);
          },
          onAnalysisComplete: (analysis) => {
            sendEvent('analysis', analysis);
          }
        });

        const result = await orchestrator.executeQuery(body.query, body.corpCode, body.confirmedRequirements);
        
        // Transform the result to match the expected format
        const finalResult = {
          status: 'success',
          rating: result.results.assessment?.rating,
          metrics: result.results.calculatedMetrics ? {
            accruals: result.results.calculatedMetrics.accruals,
            accruals_ratio: result.results.calculatedMetrics.accrualsRatio,
            cf_ni_ratio: result.results.calculatedMetrics.cfNiRatio,
            m_score: result.results.calculatedMetrics.mScore,
            total_assets: result.results.calculatedMetrics.totalAssets,
            net_income: result.results.calculatedMetrics.netIncome,
            operating_cf: result.results.calculatedMetrics.operatingCashFlow,
          } : undefined,
          alerts: result.results.assessment?.alerts,
          execution_time: {
            extraction: 0,
            calculation: 0,
            assessment: 0,
            total: Date.now() - (result.plan.createdAt || Date.now())
          },
          sources: result.results.extractedData ? [
            result.results.extractedData.cashFlow && {
              table_name: 'Cash Flow Statement',
              source_file: result.results.extractedData.cashFlow.source,
              page_number: result.results.extractedData.cashFlow.pageNumber,
              period: result.results.extractedData.cashFlow.period,
            },
            result.results.extractedData.incomeStatement && {
              table_name: 'Income Statement',
              source_file: result.results.extractedData.incomeStatement.source,
              page_number: result.results.extractedData.incomeStatement.pageNumber,
              period: result.results.extractedData.incomeStatement.period,
            },
            result.results.extractedData.balanceSheet && {
              table_name: 'Balance Sheet',
              source_file: result.results.extractedData.balanceSheet.source,
              page_number: result.results.extractedData.balanceSheet.pageNumber,
              period: result.results.extractedData.balanceSheet.period,
            }
          ].filter(Boolean) : []
        };
        
        sendEvent('result', finalResult);
        
        // Send done signal
        writer.write(encoder.encode('data: [DONE]\n\n'));
        
      } catch (error) {
        console.error('Orchestration error:', error);
        sendEvent('error', { 
          message: error instanceof Error ? error.message : 'Analysis failed' 
        });
      } finally {
        writer.close();
      }
    })();

    // Return the stream as response
    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in orchestrated analysis:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Analysis failed',
      },
      { status: 500 }
    );
  }
}