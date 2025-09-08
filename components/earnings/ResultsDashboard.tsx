'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle,
  DollarSign,
  Activity,
  BarChart3,
  FileText,
  Clock
} from 'lucide-react';

interface ResultsDashboardProps {
  result: {
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
  };
  language: 'en' | 'ko';
}

export default function ResultsDashboard({ result, language }: ResultsDashboardProps) {
  const { rating, metrics, alerts = [], execution_time, sources = [] } = result;

  const translations = {
    en: {
      overall_rating: 'Overall Earnings Quality',
      key_metrics: 'Key Metrics',
      alerts_warnings: 'Alerts & Warnings',
      data_sources: 'Data Sources',
      performance: 'Analysis Performance',
      confidence: 'Confidence',
      accruals_quality: 'Accruals Quality',
      cash_flow_quality: 'Cash Flow Quality',
      manipulation_risk: 'Manipulation Risk',
      m_score: 'Beneish M-Score',
      cf_ni_ratio: 'Operating CF / Net Income',
      accruals_ratio: 'Total Accruals / Total Assets',
      low_risk: 'Low Risk',
      high_quality: 'High Quality',
      good_backing: 'Good Cash Backing',
      score_interpretation: {
        EXCELLENT: 'Excellent earnings quality with strong cash backing',
        GOOD: 'Good earnings quality with adequate cash conversion',
        MODERATE: 'Moderate concerns, requires closer monitoring',
        POOR: 'Poor earnings quality, significant red flags detected',
      },
      execution_time_label: 'Total execution time',
      page: 'Page',
    },
    ko: {
      overall_rating: '전체 수익 품질',
      key_metrics: '주요 지표',
      alerts_warnings: '경고 및 알림',
      data_sources: '데이터 소스',
      performance: '분석 성능',
      confidence: '신뢰도',
      accruals_quality: '발생액 품질',
      cash_flow_quality: '현금흐름 품질',
      manipulation_risk: '조작 위험',
      m_score: 'Beneish M-Score',
      cf_ni_ratio: '영업 CF / 순이익',
      accruals_ratio: '총 발생액 / 총 자산',
      low_risk: '낮은 위험',
      high_quality: '높은 품질',
      good_backing: '양호한 현금 지원',
      score_interpretation: {
        EXCELLENT: '강력한 현금 지원으로 우수한 수익 품질',
        GOOD: '적절한 현금 전환으로 양호한 수익 품질',
        MODERATE: '중간 수준의 우려, 면밀한 모니터링 필요',
        POOR: '낮은 수익 품질, 중요한 위험 신호 감지',
      },
      execution_time_label: '총 실행 시간',
      page: '페이지',
    },
  };

  const t = translations[language];

  const getGradeColor = (grade?: string) => {
    switch (grade) {
      case 'EXCELLENT': return 'bg-green-100 text-green-800 border-green-200';
      case 'GOOD': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'MODERATE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'POOR': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getGradeIcon = (grade?: string) => {
    switch (grade) {
      case 'EXCELLENT': return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'GOOD': return <TrendingUp className="h-8 w-8 text-blue-600" />;
      case 'MODERATE': return <AlertTriangle className="h-8 w-8 text-yellow-600" />;
      case 'POOR': return <TrendingDown className="h-8 w-8 text-red-600" />;
      default: return <AlertCircle className="h-8 w-8 text-gray-600" />;
    }
  };

  const formatNumber = (num: number, decimals = 2) => {
    return num.toFixed(decimals);
  };

  const formatPercent = (num: number) => {
    return `${(num * 100).toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Overall Rating Card */}
      <Card className={`p-6 border-2 ${getGradeColor(rating?.grade)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {getGradeIcon(rating?.grade)}
            <div>
              <h3 className="text-2xl font-bold">{t.overall_rating}</h3>
              <p className="text-sm mt-1">
                {rating?.grade && t.score_interpretation[rating.grade]}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{rating?.score}/100</div>
            <Badge variant="outline" className="mt-2">
              {t.confidence}: {formatPercent(rating?.confidence || 0)}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Key Metrics Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-4">{t.key_metrics}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Accruals Quality */}
          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{t.accruals_quality}</p>
                <p className="text-2xl font-bold mt-1">
                  {metrics?.accruals_ratio ? formatPercent(metrics.accruals_ratio) : 'N/A'}
                </p>
                <Badge variant="outline" className="mt-2 bg-green-50">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {t.high_quality}
                </Badge>
              </div>
              <Activity className="h-5 w-5 text-gray-400" />
            </div>
          </Card>

          {/* Cash Flow Quality */}
          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{t.cash_flow_quality}</p>
                <p className="text-2xl font-bold mt-1">
                  {metrics?.cf_ni_ratio ? formatNumber(metrics.cf_ni_ratio) : 'N/A'}
                </p>
                <Badge variant="outline" className="mt-2 bg-blue-50">
                  <DollarSign className="h-3 w-3 mr-1" />
                  {t.good_backing}
                </Badge>
              </div>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
          </Card>

          {/* M-Score */}
          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{t.m_score}</p>
                <p className="text-2xl font-bold mt-1">
                  {metrics?.m_score ? formatNumber(metrics.m_score) : 'N/A'}
                </p>
                <Badge variant="outline" className="mt-2 bg-green-50">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {t.low_risk}
                </Badge>
              </div>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
          </Card>
        </div>
      </div>

      {/* Detailed Metrics */}
      <Card className="p-4">
        <h4 className="font-medium mb-3 text-sm text-gray-700">Detailed Calculations</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-gray-500">Net Income</p>
            <p className="font-medium">₩{metrics?.net_income ? (metrics.net_income / 1000000).toFixed(0) : 0}M</p>
          </div>
          <div>
            <p className="text-gray-500">Operating CF</p>
            <p className="font-medium">₩{metrics?.operating_cf ? (metrics.operating_cf / 1000000).toFixed(0) : 0}M</p>
          </div>
          <div>
            <p className="text-gray-500">Total Accruals</p>
            <p className="font-medium">₩{metrics?.accruals ? (metrics.accruals / 1000000).toFixed(0) : 0}M</p>
          </div>
          <div>
            <p className="text-gray-500">Total Assets</p>
            <p className="font-medium">₩{metrics?.total_assets ? (metrics.total_assets / 1000000).toFixed(0) : 0}M</p>
          </div>
        </div>
      </Card>

      {/* Alerts & Warnings */}
      {alerts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">{t.alerts_warnings}</h3>
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <Card key={index} className={`p-3 flex items-start gap-3 ${
                alert.severity === 'error' ? 'bg-red-50 border-red-200' :
                alert.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                {alert.severity === 'error' ? (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                ) : alert.severity === 'warning' ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{alert.message}</p>
                  {alert.metric && (
                    <p className="text-xs text-gray-600 mt-1">Related: {alert.metric}</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Data Sources */}
      {sources.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">{t.data_sources}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sources.map((source, index) => (
              <Card key={index} className="p-3 flex items-center gap-3">
                <FileText className="h-4 w-4 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{source.table_name}</p>
                  <p className="text-xs text-gray-500">
                    {source.source_file} • {t.page} {source.page_number}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {source.period}
                </Badge>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {execution_time && (
        <Card className="p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">{t.performance}</span>
            </div>
            <div className="text-sm font-medium">
              {t.execution_time_label}: {(execution_time.total / 1000).toFixed(2)}s
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}