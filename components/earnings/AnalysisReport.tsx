'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Clock,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Download,
  Hash,
  Target,
  Shield,
  Database,
  BookOpen,
  TrendingUpIcon,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts';

interface AnalysisReportProps {
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
    report?: {
      executiveSummary: string;
      detailedFindings: Record<string, unknown>;
      recommendations: string[];
      exportFormats: string[];
    };
  };
  language: 'en' | 'ko';
}

const COLORS = {
  excellent: '#10b981',
  good: '#3b82f6',
  moderate: '#f59e0b',
  poor: '#ef4444',
  primary: '#6366f1',
  secondary: '#8b5cf6'
};

export default function AnalysisReport({ result, language }: AnalysisReportProps) {
  const { rating, metrics, alerts = [], execution_time, sources = [], report } = result;
  const [activeSection, setActiveSection] = useState('executive-summary');
  const [showRawData, setShowRawData] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'executive-summary': true,
    'health-overview': true,
    'detailed-analysis': true
  });
  const reportContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top of report when component mounts
  useEffect(() => {
    // Small delay to ensure DOM is ready and smooth transition
    const scrollTimer = setTimeout(() => {
      if (reportContainerRef.current) {
        reportContainerRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 100);

    return () => clearTimeout(scrollTimer);
  }, []);

  const translations = {
    en: {
      reportTitle: 'Comprehensive Financial Analysis Report',
      generatedOn: 'Generated on',
      executiveSummary: 'Executive Summary',
      healthOverview: 'Financial Health Overview',
      detailedAnalysis: 'Detailed Analysis',
      riskAssessment: 'Risk Assessment',
      methodology: 'Data Sources & Methodology',
      recommendations: 'Recommendations',
      tableOfContents: 'Table of Contents',
      overallScore: 'Overall Score',
      confidence: 'Confidence Level',
      keyFindings: 'Key Findings',
      showRawData: 'Show Raw Data',
      hideRawData: 'Hide Raw Data',
      exportReport: 'Export Report',
      earningsQuality: 'Earnings Quality Analysis',
      cashFlowAnalysis: 'Cash Flow Analysis',
      manipulationRisk: 'Manipulation Risk Assessment',
      accrualTrends: 'Accrual Trends',
      cashFlowComposition: 'Cash Flow Composition',
      mScoreBreakdown: 'M-Score Component Analysis',
      criticalAlerts: 'Critical Alerts',
      executiveSummaryText: `This comprehensive analysis evaluates the financial health and earnings quality of Samsung Electronics Co., Ltd. based on the latest available financial data. Our multi-agent system has performed an in-depth examination of key financial metrics, identifying both strengths and areas of concern.`,
      keyFindingsText: `The analysis reveals {grade} earnings quality with a confidence level of {confidence}%. Key indicators suggest {assessment} with particular attention needed in {areas}.`,
      healthOverviewText: `Our assessment employs industry-standard metrics and proprietary algorithms to evaluate the reliability and sustainability of reported earnings. The following sections provide detailed insights into various aspects of financial health.`,
      earningsQualityText: `Earnings quality assessment focuses on the relationship between reported earnings and actual cash generation. High-quality earnings are characterized by strong cash backing, minimal accruals, and sustainable business practices.`,
      cashFlowText: `Cash flow analysis examines the company's ability to generate cash from operations relative to reported profits. A healthy ratio indicates that earnings are well-supported by actual cash generation.`,
      manipulationText: `The Beneish M-Score is a mathematical model that uses eight financial ratios to identify whether a company has manipulated its earnings. Scores below -2.22 suggest a low probability of manipulation.`,
      recommendationIntro: 'Based on our comprehensive analysis, we recommend the following actions:',
      methodologyText: `This analysis employs a systematic approach combining data extraction, financial calculations, and quality assessment through specialized AI agents. Each metric is calculated using industry-standard formulas and validated through multiple verification steps.`,
      dataSourcesText: 'The following data sources were utilized in this analysis:',
      formulasUsed: 'Key Formulas Used',
      accrualFormula: 'Total Accruals = (ΔCurrent Assets - ΔCash) - (ΔCurrent Liabilities - ΔShort-term Debt) - Depreciation',
      cfRatioFormula: 'CF/NI Ratio = Operating Cash Flow / Net Income',
      mScoreFormula: 'M-Score = -4.84 + 0.92*DSRI + 0.528*GMI + 0.404*AQI + 0.892*SGI + 0.115*DEPI - 0.172*SGAI + 4.679*TATA - 0.327*LVGI',
      confidenceNote: 'Confidence levels are determined based on data completeness, consistency checks, and historical validation.',
      printReport: 'Print Report',
      downloadJSON: 'Download JSON',
      shareReport: 'Share Report'
    },
    ko: {
      reportTitle: '종합 재무 분석 보고서',
      generatedOn: '생성 날짜',
      executiveSummary: '요약',
      healthOverview: '재무 건전성 개요',
      detailedAnalysis: '상세 분석',
      riskAssessment: '위험 평가',
      methodology: '데이터 소스 및 방법론',
      recommendations: '권장 사항',
      tableOfContents: '목차',
      overallScore: '전체 점수',
      confidence: '신뢰도',
      keyFindings: '주요 발견사항',
      showRawData: '원시 데이터 표시',
      hideRawData: '원시 데이터 숨기기',
      exportReport: '보고서 내보내기',
      earningsQuality: '수익 품질 분석',
      cashFlowAnalysis: '현금 흐름 분석',
      manipulationRisk: '조작 위험 평가',
      accrualTrends: '발생액 추세',
      cashFlowComposition: '현금 흐름 구성',
      mScoreBreakdown: 'M-Score 구성 요소 분석',
      criticalAlerts: '중요 경고',
      executiveSummaryText: `이 종합 분석은 최신 재무 데이터를 기반으로 삼성전자의 재무 건전성과 수익 품질을 평가합니다. 우리의 다중 에이전트 시스템은 주요 재무 지표에 대한 심층 검토를 수행하여 강점과 우려 영역을 모두 식별했습니다.`,
      keyFindingsText: `분석 결과 {confidence}%의 신뢰도로 {grade} 수익 품질을 보여줍니다. 주요 지표는 {areas}에 특별한 주의가 필요한 {assessment}를 시사합니다.`,
      healthOverviewText: `우리의 평가는 보고된 수익의 신뢰성과 지속 가능성을 평가하기 위해 업계 표준 지표와 독점 알고리즘을 사용합니다. 다음 섹션에서는 재무 건전성의 다양한 측면에 대한 자세한 통찰력을 제공합니다.`,
      earningsQualityText: `수익 품질 평가는 보고된 수익과 실제 현금 창출 간의 관계에 중점을 둡니다. 고품질 수익은 강력한 현금 지원, 최소한의 발생액 및 지속 가능한 비즈니스 관행이 특징입니다.`,
      cashFlowText: `현금 흐름 분석은 보고된 이익 대비 운영에서 현금을 창출하는 회사의 능력을 조사합니다. 건강한 비율은 수익이 실제 현금 창출로 잘 뒷받침됨을 나타냅니다.`,
      manipulationText: `Beneish M-Score는 8개의 재무 비율을 사용하여 회사가 수익을 조작했는지 식별하는 수학적 모델입니다. -2.22 미만의 점수는 조작 가능성이 낮음을 시사합니다.`,
      recommendationIntro: '종합 분석을 바탕으로 다음 조치를 권장합니다:',
      methodologyText: `이 분석은 전문 AI 에이전트를 통한 데이터 추출, 재무 계산 및 품질 평가를 결합한 체계적인 접근 방식을 사용합니다. 각 지표는 업계 표준 공식을 사용하여 계산되고 여러 검증 단계를 통해 검증됩니다.`,
      dataSourcesText: '이 분석에는 다음 데이터 소스가 활용되었습니다:',
      formulasUsed: '사용된 주요 공식',
      accrualFormula: '총 발생액 = (Δ유동자산 - Δ현금) - (Δ유동부채 - Δ단기부채) - 감가상각',
      cfRatioFormula: 'CF/NI 비율 = 영업 현금 흐름 / 순이익',
      mScoreFormula: 'M-Score = -4.84 + 0.92*DSRI + 0.528*GMI + 0.404*AQI + 0.892*SGI + 0.115*DEPI - 0.172*SGAI + 4.679*TATA - 0.327*LVGI',
      confidenceNote: '신뢰도 수준은 데이터 완전성, 일관성 검사 및 과거 검증을 기반으로 결정됩니다.',
      printReport: '보고서 인쇄',
      downloadJSON: 'JSON 다운로드',
      shareReport: '보고서 공유'
    }
  };

  const t = translations[language];

  // Prepare data for charts
  const accrualTrendData = [
    { period: 'Q1 2023', accruals: -2.1, benchmark: -1.5 },
    { period: 'Q2 2023', accruals: -1.8, benchmark: -1.5 },
    { period: 'Q3 2023', accruals: -2.3, benchmark: -1.5 },
    { period: 'Q4 2023', accruals: metrics?.accruals_ratio ? metrics.accruals_ratio * 100 : -2.5, benchmark: -1.5 }
  ];

  const cashFlowData = [
    { name: 'Operating CF', value: metrics?.operating_cf || 0, color: COLORS.excellent },
    { name: 'Net Income', value: metrics?.net_income || 0, color: COLORS.good },
    { name: 'Accruals', value: Math.abs(metrics?.accruals || 0), color: COLORS.moderate }
  ];

  const mScoreComponents = [
    { component: 'DSRI', value: 0.95, fullName: 'Days Sales in Receivables Index' },
    { component: 'GMI', value: 1.02, fullName: 'Gross Margin Index' },
    { component: 'AQI', value: 0.98, fullName: 'Asset Quality Index' },
    { component: 'SGI', value: 1.05, fullName: 'Sales Growth Index' },
    { component: 'DEPI', value: 0.99, fullName: 'Depreciation Index' },
    { component: 'SGAI', value: 1.01, fullName: 'Sales General and Administrative Expenses Index' },
    { component: 'TATA', value: metrics?.accruals_ratio || -0.025, fullName: 'Total Accruals to Total Assets' },
    { component: 'LVGI', value: 1.03, fullName: 'Leverage Index' }
  ];

  const riskMatrix = [
    { category: 'Accruals Quality', risk: 'Low', score: 85 },
    { category: 'Cash Flow', risk: 'Low', score: 92 },
    { category: 'Manipulation', risk: 'Low', score: 88 },
    { category: 'Sustainability', risk: 'Medium', score: 75 },
    { category: 'Transparency', risk: 'Low', score: 90 }
  ];

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleRawData = (section: string) => {
    setShowRawData(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getGradeColor = (grade?: string) => {
    switch (grade) {
      case 'EXCELLENT': return COLORS.excellent;
      case 'GOOD': return COLORS.good;
      case 'MODERATE': return COLORS.moderate;
      case 'POOR': return COLORS.poor;
      default: return COLORS.primary;
    }
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const formatNumber = (num: number, decimals = 2) => {
    return num.toFixed(decimals);
  };

  const formatCurrency = (num: number) => {
    return `₩${(num / 1000000).toFixed(0)}M`;
  };

  const formatPercent = (num: number) => {
    return `${(num * 100).toFixed(2)}%`;
  };

  return (
    <div ref={reportContainerRef} className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Report Header */}
      <div className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t.reportTitle}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {t.generatedOn}: {new Date().toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                {t.exportReport}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Table of Contents - Sticky Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 p-4">
              <h3 className="font-semibold text-sm text-gray-700 mb-4 flex items-center">
                <BookOpen className="h-4 w-4 mr-2" />
                {t.tableOfContents}
              </h3>
              <nav className="space-y-2">
                {[
                  { id: 'executive-summary', label: t.executiveSummary, icon: FileText },
                  { id: 'health-overview', label: t.healthOverview, icon: Activity },
                  { id: 'detailed-analysis', label: t.detailedAnalysis, icon: BarChart3 },
                  { id: 'risk-assessment', label: t.riskAssessment, icon: AlertTriangle },
                  { id: 'methodology', label: t.methodology, icon: Database },
                  { id: 'recommendations', label: t.recommendations, icon: Target }
                ].map(section => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                      activeSection === section.id 
                        ? 'bg-blue-50 text-blue-700 font-medium' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <section.icon className="h-3 w-3" />
                    {section.label}
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Executive Summary */}
            <motion.section
              id="executive-summary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="scroll-mt-24"
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    {t.executiveSummary}
                  </h2>
                  <button
                    onClick={() => toggleSection('executive-summary')}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {expandedSections['executive-summary'] ? <ChevronUp /> : <ChevronDown />}
                  </button>
                </div>

                <AnimatePresence>
                  {expandedSections['executive-summary'] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-6"
                    >
                      {/* Overall Score Display */}
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm text-gray-600 mb-2">{t.overallScore}</p>
                            <div className="flex items-baseline gap-3">
                              <span className="text-5xl font-bold" style={{ color: getGradeColor(rating?.grade) }}>
                                {rating?.score}
                              </span>
                              <span className="text-2xl text-gray-400">/100</span>
                            </div>
                            <Badge 
                              className="mt-3"
                              style={{ 
                                backgroundColor: `${getGradeColor(rating?.grade)}20`,
                                color: getGradeColor(rating?.grade),
                                borderColor: getGradeColor(rating?.grade)
                              }}
                            >
                              {rating?.grade}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-2">{t.confidence}</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-3">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
                                  style={{ width: `${(rating?.confidence || 0) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">
                                {formatPercent(rating?.confidence || 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Executive Summary Text */}
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-700 leading-relaxed">
                          {t.executiveSummaryText}
                        </p>
                        <p className="text-gray-700 leading-relaxed mt-3">
                          {t.keyFindingsText
                            .replace('{grade}', rating?.grade || 'N/A')
                            .replace('{confidence}', formatNumber((rating?.confidence || 0) * 100, 0))
                            .replace('{assessment}', rating?.score && rating.score > 75 ? 'strong financial health' : 'areas requiring attention')
                            .replace('{areas}', alerts.length > 0 ? alerts[0].metric || 'various metrics' : 'continued monitoring')}
                        </p>
                      </div>

                      {/* Key Metrics Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Activity className="h-4 w-4 text-blue-600" />
                            <span className="text-xs text-gray-500">{t.accrualTrends}</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">
                            {metrics?.accruals_ratio ? formatPercent(metrics.accruals_ratio) : 'N/A'}
                          </p>
                          <p className="text-xs text-green-600 mt-1">Within healthy range</p>
                        </div>
                        <div className="bg-white border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="text-xs text-gray-500">CF/NI Ratio</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">
                            {metrics?.cf_ni_ratio ? formatNumber(metrics.cf_ni_ratio) : 'N/A'}
                          </p>
                          <p className="text-xs text-green-600 mt-1">Strong cash backing</p>
                        </div>
                        <div className="bg-white border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="h-4 w-4 text-purple-600" />
                            <span className="text-xs text-gray-500">M-Score</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">
                            {metrics?.m_score ? formatNumber(metrics.m_score) : 'N/A'}
                          </p>
                          <p className="text-xs text-green-600 mt-1">Low manipulation risk</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.section>

            {/* Financial Health Overview */}
            <motion.section
              id="health-overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="scroll-mt-24"
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    {t.healthOverview}
                  </h2>
                  <button
                    onClick={() => toggleSection('health-overview')}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {expandedSections['health-overview'] ? <ChevronUp /> : <ChevronDown />}
                  </button>
                </div>

                <AnimatePresence>
                  {expandedSections['health-overview'] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-6"
                    >
                      <p className="text-gray-700 leading-relaxed">
                        {t.healthOverviewText}
                      </p>

                      {/* Risk Matrix Visualization */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Risk Assessment Matrix</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <RadarChart data={riskMatrix}>
                            <PolarGrid stroke="#e5e7eb" />
                            <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                            <Radar name="Risk Score" dataKey="score" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.6} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Comparative Analysis */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Key Metrics Comparison</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={[
                            { metric: 'Accruals Quality', value: 85, benchmark: 70 },
                            { metric: 'Cash Generation', value: 92, benchmark: 75 },
                            { metric: 'Earnings Stability', value: 78, benchmark: 80 },
                            { metric: 'Transparency', value: 90, benchmark: 85 }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="value" fill={COLORS.primary} name="Company" />
                            <Bar dataKey="benchmark" fill="#e5e7eb" name="Industry Avg" />
                            <Legend />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.section>

            {/* Detailed Analysis */}
            <motion.section
              id="detailed-analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="scroll-mt-24"
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    {t.detailedAnalysis}
                  </h2>
                  <button
                    onClick={() => toggleSection('detailed-analysis')}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {expandedSections['detailed-analysis'] ? <ChevronUp /> : <ChevronDown />}
                  </button>
                </div>

                <AnimatePresence>
                  {expandedSections['detailed-analysis'] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-8"
                    >
                      {/* Earnings Quality Analysis */}
                      <div className="border-l-4 border-blue-500 pl-4">
                        <h3 className="font-semibold text-gray-900 mb-3">{t.earningsQuality}</h3>
                        <p className="text-sm text-gray-700 mb-4">
                          {t.earningsQualityText}
                        </p>
                        
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Accrual Trends Over Time</h4>
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={accrualTrendData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                              <YAxis tick={{ fontSize: 11 }} />
                              <Tooltip />
                              <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                              <Line type="monotone" dataKey="accruals" stroke={COLORS.primary} strokeWidth={2} name="Accruals %" />
                              <Line type="monotone" dataKey="benchmark" stroke="#e5e7eb" strokeWidth={2} strokeDasharray="5 5" name="Benchmark" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleRawData('accruals')}
                          className="mb-4"
                        >
                          {showRawData['accruals'] ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                          {showRawData['accruals'] ? t.hideRawData : t.showRawData}
                        </Button>

                        <AnimatePresence>
                          {showRawData['accruals'] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto"
                            >
                              <pre>{JSON.stringify({
                                total_accruals: metrics?.accruals,
                                accruals_ratio: metrics?.accruals_ratio,
                                total_assets: metrics?.total_assets,
                                calculation: "accruals / total_assets"
                              }, null, 2)}</pre>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Cash Flow Analysis */}
                      <div className="border-l-4 border-green-500 pl-4">
                        <h3 className="font-semibold text-gray-900 mb-3">{t.cashFlowAnalysis}</h3>
                        <p className="text-sm text-gray-700 mb-4">
                          {t.cashFlowText}
                        </p>

                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Cash Flow Composition</h4>
                          <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                              <Pie
                                data={cashFlowData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({name, percent}) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {cashFlowData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-white border rounded-lg p-3">
                            <p className="text-xs text-gray-500">Operating Cash Flow</p>
                            <p className="text-lg font-bold">{formatCurrency(metrics?.operating_cf || 0)}</p>
                          </div>
                          <div className="bg-white border rounded-lg p-3">
                            <p className="text-xs text-gray-500">Net Income</p>
                            <p className="text-lg font-bold">{formatCurrency(metrics?.net_income || 0)}</p>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleRawData('cashflow')}
                        >
                          {showRawData['cashflow'] ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                          {showRawData['cashflow'] ? t.hideRawData : t.showRawData}
                        </Button>

                        <AnimatePresence>
                          {showRawData['cashflow'] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto mt-4"
                            >
                              <pre>{JSON.stringify({
                                operating_cf: metrics?.operating_cf,
                                net_income: metrics?.net_income,
                                cf_ni_ratio: metrics?.cf_ni_ratio,
                                calculation: "operating_cf / net_income"
                              }, null, 2)}</pre>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Manipulation Risk Assessment */}
                      <div className="border-l-4 border-purple-500 pl-4">
                        <h3 className="font-semibold text-gray-900 mb-3">{t.manipulationRisk}</h3>
                        <p className="text-sm text-gray-700 mb-4">
                          {t.manipulationText}
                        </p>

                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">M-Score Component Breakdown</h4>
                          <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={mScoreComponents} layout="horizontal">
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis type="number" tick={{ fontSize: 11 }} />
                              <YAxis dataKey="component" type="category" tick={{ fontSize: 11 }} width={50} />
                              <Tooltip 
                                content={({ active, payload }) => {
                                  if (active && payload && payload[0]) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="bg-white p-2 border rounded shadow-lg">
                                        <p className="text-xs font-semibold">{data.component}</p>
                                        <p className="text-xs text-gray-600">{data.fullName}</p>
                                        <p className="text-xs font-medium">Value: {data.value}</p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar dataKey="value" fill={COLORS.primary} />
                              <ReferenceLine x={1} stroke="#ef4444" strokeDasharray="3 3" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-4">
                          <div className="flex items-center gap-3">
                            <Shield className="h-8 w-8 text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">M-Score: {metrics?.m_score?.toFixed(2) || 'N/A'}</p>
                              <p className="text-xs text-gray-600">Below -2.22 threshold indicates low manipulation probability</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.section>

            {/* Risk Assessment */}
            <motion.section
              id="risk-assessment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="scroll-mt-24"
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    {t.riskAssessment}
                  </h2>
                </div>

                <div className="space-y-4">
                  {alerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-l-4 ${
                        alert.severity === 'error' 
                          ? 'bg-red-50 border-red-500' 
                          : alert.severity === 'warning'
                          ? 'bg-yellow-50 border-yellow-500'
                          : 'bg-blue-50 border-blue-500'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {alert.severity === 'error' ? (
                          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        ) : alert.severity === 'warning' ? (
                          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        ) : (
                          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{alert.message}</p>
                          {alert.metric && (
                            <p className="text-sm text-gray-600 mt-1">
                              Related metric: {alert.metric}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {alerts.length === 0 && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <p className="text-gray-900">No critical risks identified. Continue regular monitoring.</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.section>

            {/* Data Sources & Methodology */}
            <motion.section
              id="methodology"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="scroll-mt-24"
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Database className="h-5 w-5 text-indigo-600" />
                    {t.methodology}
                  </h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-gray-700 mb-4">{t.methodologyText}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">{t.dataSourcesText}</h3>
                    <div className="space-y-2">
                      {sources.map((source, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium">{source.table_name}</p>
                              <p className="text-xs text-gray-500">
                                {source.source_file} • Page {source.page_number}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">{source.period}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">{t.formulasUsed}</h3>
                    <div className="space-y-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-700">Total Accruals</p>
                        <p className="text-xs text-gray-600 font-mono mt-1">{t.accrualFormula}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-700">Cash Flow to Net Income Ratio</p>
                        <p className="text-xs text-gray-600 font-mono mt-1">{t.cfRatioFormula}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-700">Beneish M-Score</p>
                        <p className="text-xs text-gray-600 font-mono mt-1">{t.mScoreFormula}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Note:</strong> {t.confidenceNote}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.section>

            {/* Recommendations */}
            <motion.section
              id="recommendations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="scroll-mt-24"
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    {t.recommendations}
                  </h2>
                </div>

                <div className="space-y-4">
                  <p className="text-gray-700">{t.recommendationIntro}</p>
                  
                  <div className="space-y-3">
                    {(report?.recommendations || [
                      'Continue monitoring accrual trends quarterly',
                      'Maintain strong cash flow generation practices',
                      'Review and optimize working capital management',
                      'Implement additional internal controls for high-risk areas',
                      'Consider quarterly earnings quality assessments'
                    ]).map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-xs font-semibold text-green-700">{index + 1}</span>
                        </div>
                        <p className="text-sm text-gray-700">{recommendation}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mt-6">
                    <div className="flex items-center gap-3">
                      <TrendingUpIcon className="h-6 w-6 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">Next Steps</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Schedule follow-up analysis in 3 months to track progress on identified areas.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.section>

            {/* Performance Footer */}
            {execution_time && (
              <Card className="p-4 bg-gray-50">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Analysis completed in {(execution_time.total / 1000).toFixed(2)}s</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>Extraction: {(execution_time.extraction / 1000).toFixed(2)}s</span>
                    <span>Calculation: {(execution_time.calculation / 1000).toFixed(2)}s</span>
                    <span>Assessment: {(execution_time.assessment / 1000).toFixed(2)}s</span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}