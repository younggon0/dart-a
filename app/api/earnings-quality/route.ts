import { NextRequest, NextResponse } from 'next/server';
import { DataExtractionAgent } from '@/lib/agents/DataExtractionAgent';
import { CalculationAgent } from '@/lib/agents/CalculationAgent';
import { QualityAssessmentAgent } from '@/lib/agents/QualityAssessmentAgent';

export interface EarningsQualityRequest {
  corpCode: string;
  query: string;
  language: 'en' | 'ko';
}

export interface EarningsQualityResponse {
  status: 'success' | 'error';
  rating?: {
    score: number;
    grade: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR';
    confidence: number;
  };
  metrics?: {
    accruals: number;
    accruals_ratio: number;
    cf_ni_ratio: number;
    m_score: number;
    total_assets: number;
    net_income: number;
    operating_cf: number;
  };
  alerts?: Array<{
    severity: 'info' | 'warning' | 'error';
    message: string;
    metric?: string;
  }>;
  execution_time?: {
    extraction: number;
    calculation: number;
    assessment: number;
    total: number;
  };
  sources?: Array<{
    table_name: string;
    source_file: string;
    page_number: number;
    period: string;
  }>;
  error?: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const executionTime = {
    extraction: 0,
    calculation: 0,
    assessment: 0,
    total: 0,
  };

  try {
    const body: EarningsQualityRequest = await request.json();
    
    if (!body.corpCode) {
      return NextResponse.json(
        { status: 'error', error: 'Corp code is required' },
        { status: 400 }
      );
    }

    console.log('Starting earnings quality analysis for:', body.corpCode);

    // Phase 1: Data Extraction
    const extractionStart = Date.now();
    const extractionAgent = new DataExtractionAgent(body.corpCode);
    const extractedData = await extractionAgent.extract();
    executionTime.extraction = Date.now() - extractionStart;
    console.log(`Extraction completed in ${executionTime.extraction}ms`);

    // Phase 2: Calculation
    const calculationStart = Date.now();
    const calculationAgent = new CalculationAgent(extractedData);
    const metrics = calculationAgent.calculate();
    executionTime.calculation = Date.now() - calculationStart;
    console.log(`Calculation completed in ${executionTime.calculation}ms`);

    // Phase 3: Quality Assessment
    const assessmentStart = Date.now();
    const assessmentAgent = new QualityAssessmentAgent(metrics);
    const assessment = assessmentAgent.assess();
    executionTime.assessment = Date.now() - assessmentStart;
    console.log(`Assessment completed in ${executionTime.assessment}ms`);

    // Calculate total execution time
    executionTime.total = Date.now() - startTime;

    // Prepare sources for response
    const sources = [];
    
    if (extractedData.cashFlow) {
      sources.push({
        table_name: 'Cash Flow Statement',
        source_file: extractedData.cashFlow.source,
        page_number: extractedData.cashFlow.pageNumber,
        period: extractedData.cashFlow.period,
      });
    }
    
    if (extractedData.incomeStatement) {
      sources.push({
        table_name: 'Income Statement',
        source_file: extractedData.incomeStatement.source,
        page_number: extractedData.incomeStatement.pageNumber,
        period: extractedData.incomeStatement.period,
      });
    }
    
    if (extractedData.balanceSheet) {
      sources.push({
        table_name: 'Balance Sheet',
        source_file: extractedData.balanceSheet.source,
        page_number: extractedData.balanceSheet.pageNumber,
        period: extractedData.balanceSheet.period,
      });
    }

    // Build response
    const response: EarningsQualityResponse = {
      status: 'success',
      rating: assessment.rating,
      metrics: {
        accruals: metrics.accruals,
        accruals_ratio: metrics.accrualsRatio,
        cf_ni_ratio: metrics.cfNiRatio,
        m_score: metrics.mScore,
        total_assets: metrics.totalAssets,
        net_income: metrics.netIncome,
        operating_cf: metrics.operatingCashFlow,
      },
      alerts: assessment.alerts,
      execution_time: executionTime,
      sources,
    };

    console.log(`Total analysis completed in ${executionTime.total}ms`);
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in earnings quality analysis:', error);
    
    return NextResponse.json(
      {
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'Analysis failed',
        execution_time: {
          extraction: executionTime.extraction,
          calculation: executionTime.calculation,
          assessment: executionTime.assessment,
          total: Date.now() - startTime,
        },
      },
      { status: 500 }
    );
  }
}