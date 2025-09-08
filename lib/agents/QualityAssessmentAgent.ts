import { CalculatedMetrics } from './CalculationAgent';

export interface QualityAssessment {
  rating: {
    score: number;
    grade: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR';
    confidence: number;
  };
  alerts: Array<{
    severity: 'info' | 'warning' | 'error';
    message: string;
    metric?: string;
  }>;
  insights: {
    accrualQuality: string;
    cashFlowQuality: string;
    manipulationRisk: string;
    overallAssessment: string;
  };
}

export class QualityAssessmentAgent {
  private metrics: CalculatedMetrics;

  constructor(metrics: CalculatedMetrics) {
    this.metrics = metrics;
  }

  assess(): QualityAssessment {
    console.log('QualityAssessmentAgent: Starting assessment');

    // Calculate individual scores
    const accrualScore = this.assessAccrualQuality();
    const cashFlowScore = this.assessCashFlowQuality();
    const manipulationScore = this.assessManipulationRisk();

    // Calculate overall score (weighted average)
    const overallScore = this.calculateOverallScore(
      accrualScore,
      cashFlowScore,
      manipulationScore
    );

    // Determine grade
    const grade = this.determineGrade(overallScore);

    // Calculate confidence based on data completeness
    const confidence = this.metrics.hasAllData ? 0.85 : 0.7;

    // Generate alerts
    const alerts = this.generateAlerts();

    // Generate insights
    const insights = this.generateInsights(accrualScore, cashFlowScore, manipulationScore);

    return {
      rating: {
        score: overallScore,
        grade,
        confidence,
      },
      alerts,
      insights,
    };
  }

  private assessAccrualQuality(): number {
    const { accrualsRatio } = this.metrics;
    
    // Scoring based on accruals ratio
    // Lower accruals = higher quality
    if (Math.abs(accrualsRatio) < 0.02) {
      return 95; // Excellent: Less than 2%
    } else if (Math.abs(accrualsRatio) < 0.05) {
      return 80; // Good: Less than 5%
    } else if (Math.abs(accrualsRatio) < 0.10) {
      return 60; // Moderate: Less than 10%
    } else {
      return 40; // Poor: Greater than 10%
    }
  }

  private assessCashFlowQuality(): number {
    const { cfNiRatio } = this.metrics;
    
    // Scoring based on CF/NI ratio
    // Higher ratio = better cash conversion
    if (cfNiRatio > 1.2) {
      return 95; // Excellent: Strong cash generation
    } else if (cfNiRatio > 0.8) {
      return 80; // Good: Adequate cash conversion
    } else if (cfNiRatio > 0.5) {
      return 60; // Moderate: Some concerns
    } else {
      return 40; // Poor: Weak cash conversion
    }
  }

  private assessManipulationRisk(): number {
    const { mScore } = this.metrics;
    
    // M-Score interpretation
    // < -2.22: Low probability of manipulation
    // > -2.22: Higher probability of manipulation
    if (mScore < -3.0) {
      return 95; // Very low risk
    } else if (mScore < -2.22) {
      return 80; // Low risk (below threshold)
    } else if (mScore < -1.78) {
      return 60; // Moderate risk
    } else {
      return 40; // High risk
    }
  }

  private calculateOverallScore(
    accrualScore: number,
    cashFlowScore: number,
    manipulationScore: number
  ): number {
    // Weighted average
    const weights = {
      accrual: 0.35,
      cashFlow: 0.35,
      manipulation: 0.30,
    };

    const score = Math.round(
      accrualScore * weights.accrual +
      cashFlowScore * weights.cashFlow +
      manipulationScore * weights.manipulation
    );

    return Math.min(100, Math.max(0, score));
  }

  private determineGrade(score: number): 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR' {
    if (score >= 85) return 'EXCELLENT';
    if (score >= 70) return 'GOOD';
    if (score >= 50) return 'MODERATE';
    return 'POOR';
  }

  private generateAlerts(): Array<{ severity: 'info' | 'warning' | 'error'; message: string; metric?: string }> {
    const alerts = [];
    const { accrualsRatio, cfNiRatio, mScore, hasAllData } = this.metrics;

    // Data completeness alert
    if (!hasAllData) {
      alerts.push({
        severity: 'warning' as const,
        message: 'Some financial data was not available. Using estimates for missing values.',
        metric: 'Data Completeness',
      });
    }

    // Accruals alerts
    if (Math.abs(accrualsRatio) > 0.10) {
      alerts.push({
        severity: 'error' as const,
        message: `High accruals ratio of ${(accrualsRatio * 100).toFixed(2)}% indicates potential earnings management`,
        metric: 'Accruals Ratio',
      });
    } else if (Math.abs(accrualsRatio) > 0.05) {
      alerts.push({
        severity: 'warning' as const,
        message: `Moderate accruals ratio of ${(accrualsRatio * 100).toFixed(2)}% warrants closer monitoring`,
        metric: 'Accruals Ratio',
      });
    } else {
      alerts.push({
        severity: 'info' as const,
        message: `Low accruals ratio of ${(accrualsRatio * 100).toFixed(2)}% indicates earnings are well-backed by cash`,
        metric: 'Accruals Ratio',
      });
    }

    // Cash flow alerts
    if (cfNiRatio < 0.5) {
      alerts.push({
        severity: 'error' as const,
        message: `Poor cash conversion with CF/NI ratio of ${cfNiRatio.toFixed(2)}`,
        metric: 'Cash Flow Quality',
      });
    } else if (cfNiRatio < 0.8) {
      alerts.push({
        severity: 'warning' as const,
        message: `Below-average cash conversion with CF/NI ratio of ${cfNiRatio.toFixed(2)}`,
        metric: 'Cash Flow Quality',
      });
    } else if (cfNiRatio > 1.2) {
      alerts.push({
        severity: 'info' as const,
        message: `Excellent cash generation with CF/NI ratio of ${cfNiRatio.toFixed(2)}`,
        metric: 'Cash Flow Quality',
      });
    }

    // M-Score alerts
    if (mScore > -2.22) {
      alerts.push({
        severity: 'warning' as const,
        message: `M-Score of ${mScore.toFixed(2)} is above threshold, indicating higher manipulation risk`,
        metric: 'Beneish M-Score',
      });
    } else {
      alerts.push({
        severity: 'info' as const,
        message: `M-Score of ${mScore.toFixed(2)} is well below threshold, indicating low manipulation risk`,
        metric: 'Beneish M-Score',
      });
    }

    return alerts;
  }

  private generateInsights(
    accrualScore: number,
    cashFlowScore: number,
    manipulationScore: number
  ): QualityAssessment['insights'] {
    const { accrualsRatio, cfNiRatio, mScore } = this.metrics;

    return {
      accrualQuality: this.getAccrualQualityInsight(accrualScore, accrualsRatio),
      cashFlowQuality: this.getCashFlowQualityInsight(cashFlowScore, cfNiRatio),
      manipulationRisk: this.getManipulationRiskInsight(manipulationScore, mScore),
      overallAssessment: this.getOverallAssessmentInsight(accrualScore, cashFlowScore, manipulationScore),
    };
  }

  private getAccrualQualityInsight(score: number, ratio: number): string {
    if (score >= 85) {
      return `Excellent accrual quality with ${(ratio * 100).toFixed(2)}% ratio. Earnings are strongly backed by cash.`;
    } else if (score >= 70) {
      return `Good accrual quality with ${(ratio * 100).toFixed(2)}% ratio. Earnings show reasonable cash backing.`;
    } else if (score >= 50) {
      return `Moderate accrual quality with ${(ratio * 100).toFixed(2)}% ratio. Some divergence between earnings and cash.`;
    } else {
      return `Poor accrual quality with ${(ratio * 100).toFixed(2)}% ratio. Significant gap between reported earnings and cash.`;
    }
  }

  private getCashFlowQualityInsight(score: number, ratio: number): string {
    if (score >= 85) {
      return `Outstanding cash generation with ${ratio.toFixed(2)}x coverage. Operating cash flow exceeds net income.`;
    } else if (score >= 70) {
      return `Solid cash conversion with ${ratio.toFixed(2)}x coverage. Most earnings are converting to cash.`;
    } else if (score >= 50) {
      return `Adequate cash flow with ${ratio.toFixed(2)}x coverage. Some earnings not converting to cash.`;
    } else {
      return `Weak cash generation with ${ratio.toFixed(2)}x coverage. Earnings quality is questionable.`;
    }
  }

  private getManipulationRiskInsight(score: number, mScore: number): string {
    if (score >= 85) {
      return `Very low manipulation risk with M-Score of ${mScore.toFixed(2)}. No signs of earnings management detected.`;
    } else if (score >= 70) {
      return `Low manipulation risk with M-Score of ${mScore.toFixed(2)}. Financial reporting appears reliable.`;
    } else if (score >= 50) {
      return `Moderate manipulation risk with M-Score of ${mScore.toFixed(2)}. Some red flags present.`;
    } else {
      return `High manipulation risk with M-Score of ${mScore.toFixed(2)}. Multiple warning signs detected.`;
    }
  }

  private getOverallAssessmentInsight(
    accrualScore: number,
    cashFlowScore: number,
    manipulationScore: number
  ): string {
    const avgScore = (accrualScore + cashFlowScore + manipulationScore) / 3;

    if (avgScore >= 85) {
      return 'Overall earnings quality is excellent. The company shows strong cash generation, low accruals, and no signs of manipulation. This is institutional-grade quality.';
    } else if (avgScore >= 70) {
      return 'Overall earnings quality is good. The company demonstrates solid fundamentals with minor areas for improvement. Suitable for most investment strategies.';
    } else if (avgScore >= 50) {
      return 'Overall earnings quality is moderate. Several yellow flags require monitoring. Consider additional due diligence before investment decisions.';
    } else {
      return 'Overall earnings quality is poor. Multiple red flags indicate potential earnings management or financial distress. High-risk investment.';
    }
  }
}