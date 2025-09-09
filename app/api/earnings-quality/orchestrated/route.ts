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

    // Function to send SSE events with chunking to avoid gvproxy 2KB buffer limit
    const sendEvent = (type: string, data: unknown) => {
      try {
        // Ensure proper JSON stringification with no line breaks in the JSON itself
        const jsonStr = JSON.stringify({ type, data });
        
        // Check if message exceeds safe size for gvproxy (leave margin for SSE format)
        const MAX_CHUNK_SIZE = 1800; // Safe under 2KB with SSE format overhead
        
        if (jsonStr.length > MAX_CHUNK_SIZE) {
          // Split large messages into chunks
          const messageId = Math.random().toString(36).substring(7);
          const chunks: string[] = [];
          
          // Split the JSON string into chunks
          for (let i = 0; i < jsonStr.length; i += MAX_CHUNK_SIZE) {
            chunks.push(jsonStr.substring(i, i + MAX_CHUNK_SIZE));
          }
          
          // Send each chunk as a separate SSE event
          chunks.forEach((chunk, index) => {
            const chunkEvent = {
              type: 'chunk',
              messageId,
              chunkIndex: index,
              totalChunks: chunks.length,
              chunk,
              originalType: type
            };
            const event = `data: ${JSON.stringify(chunkEvent)}\n\n`;
            writer.write(encoder.encode(event));
          });
        } else {
          // Message is small enough to send as-is
          const event = `data: ${jsonStr}\n\n`;
          writer.write(encoder.encode(event));
        }
      } catch (e) {
        console.error('Failed to send SSE event:', e);
        // Send error event if serialization fails
        const errorEvent = `data: ${JSON.stringify({ type: 'error', data: { message: 'Event serialization failed' } })}\n\n`;
        writer.write(encoder.encode(errorEvent));
      }
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
        const assessment = result.results.assessment as { 
          rating?: unknown; 
          alerts?: unknown;
        } | undefined;
        const calculatedMetrics = result.results.calculatedMetrics as {
          accruals?: number;
          accrualsRatio?: number;
          cfNiRatio?: number;
          mScore?: number;
          totalAssets?: number;
          netIncome?: number;
          operatingCashFlow?: number;
        } | undefined;
        const extractedData = result.results.extractedData as {
          cashFlow?: { source: string; pageNumber: number; period: string };
          incomeStatement?: { source: string; pageNumber: number; period: string };
          balanceSheet?: { source: string; pageNumber: number; period: string };
        } | undefined;
        
        const finalResult = {
          status: 'success',
          rating: assessment?.rating,
          metrics: calculatedMetrics ? {
            accruals: calculatedMetrics.accruals,
            accruals_ratio: calculatedMetrics.accrualsRatio,
            cf_ni_ratio: calculatedMetrics.cfNiRatio,
            m_score: calculatedMetrics.mScore,
            total_assets: calculatedMetrics.totalAssets,
            net_income: calculatedMetrics.netIncome,
            operating_cf: calculatedMetrics.operatingCashFlow,
          } : undefined,
          alerts: assessment?.alerts,
          execution_time: {
            extraction: 0,
            calculation: 0,
            assessment: 0,
            total: Date.now() - (result.plan.createdAt || Date.now())
          },
          sources: extractedData ? [
            extractedData.cashFlow && {
              table_name: 'Cash Flow Statement',
              source_file: extractedData.cashFlow.source,
              page_number: extractedData.cashFlow.pageNumber,
              period: extractedData.cashFlow.period,
            },
            extractedData.incomeStatement && {
              table_name: 'Income Statement',
              source_file: extractedData.incomeStatement.source,
              page_number: extractedData.incomeStatement.pageNumber,
              period: extractedData.incomeStatement.period,
            },
            extractedData.balanceSheet && {
              table_name: 'Balance Sheet',
              source_file: extractedData.balanceSheet.source,
              page_number: extractedData.balanceSheet.pageNumber,
              period: extractedData.balanceSheet.period,
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