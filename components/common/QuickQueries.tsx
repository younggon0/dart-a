'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QuickQuery {
  label: string;
  query: string;
  icon?: string;
}

interface QuickQueriesProps {
  onQuerySelect: (query: string) => void;
  language?: 'en' | 'ko';
}

const ENGLISH_QUERIES: QuickQuery[] = [
  { label: 'Latest Revenue', query: 'What is the latest revenue and year-over-year growth?', icon: '💰' },
  { label: 'Operating Profit', query: 'Show me operating profit trends for the last 3 years', icon: '📈' },
  { label: 'Balance Sheet', query: 'Summarize the latest balance sheet key items', icon: '💼' },
  { label: 'Debt Analysis', query: 'What is the current debt ratio and capital structure?', icon: '📊' },
  { label: 'Cash Flow', query: 'Show operating and investing cash flow', icon: '💵' },
  { label: 'R&D Investment', query: 'What is the R&D investment amount and percentage of revenue?', icon: '🔬' },
];

const KOREAN_QUERIES: QuickQuery[] = [
  { label: '최근 매출', query: '최근 분기 매출액과 전년 동기 대비 성장률을 알려주세요', icon: '💰' },
  { label: '영업이익', query: '최근 3개년 영업이익 변화 추이를 보여주세요', icon: '📈' },
  { label: '재무상태표', query: '최신 재무상태표의 주요 항목을 요약해주세요', icon: '💼' },
  { label: '부채비율', query: '현재 부채비율과 자본 구조를 분석해주세요', icon: '📊' },
  { label: '현금흐름', query: '영업활동 현금흐름과 투자활동 현금흐름을 알려주세요', icon: '💵' },
  { label: '연구개발비', query: '최근 연구개발비 투자 규모와 매출 대비 비율을 보여주세요', icon: '🔬' },
];

export default function QuickQueries({ onQuerySelect, language = 'en' }: QuickQueriesProps) {
  const queries = language === 'ko' ? KOREAN_QUERIES : ENGLISH_QUERIES;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {language === 'ko' ? '빠른 쿼리' : 'Quick Queries'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {queries.map((item, index) => (
            <Button
              key={index}
              variant="outline"
              className="justify-start text-left h-auto py-2 px-3"
              onClick={() => onQuerySelect(item.query)}
            >
              <span className="mr-2">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </Button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          {language === 'ko' 
            ? '위 버튼을 클릭하여 자주 사용하는 질문을 빠르게 선택하세요'
            : 'Click a button above to quickly select common queries'}
        </p>
      </CardContent>
    </Card>
  );
}