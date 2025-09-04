'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  searchResults?: unknown[];
}

interface QuickQuery {
  label: string;
  query: string;
  icon?: string;
}

interface ChatInterfaceProps {
  language?: 'en' | 'ko';
}

const ENGLISH_QUERIES: QuickQuery[] = [
  { label: 'Latest Revenue', query: 'Show me the latest annual revenue and calculate year-over-year growth rate', icon: '💰' },
  { label: 'Profit Trends', query: 'Show me operating profit trends for the last 3 years with growth rates', icon: '📈' },
  { label: 'Cash Flow', query: 'Show operating and investing cash flow for recent periods', icon: '💵' },
  { label: 'Balance Sheet', query: 'Summarize the latest balance sheet key items including total assets and equity', icon: '💼' },
  { label: 'Debt Analysis', query: 'What is the current debt ratio and capital structure?', icon: '📊' },
  { label: 'R&D Investment', query: 'What is the R&D investment amount and percentage of revenue?', icon: '🔬' },
];

const KOREAN_QUERIES: QuickQuery[] = [
  { label: '최근 매출', query: '최근 분기 매출액과 전년 동기 대비 성장률을 알려주세요', icon: '💰' },
  { label: '영업이익', query: '최근 3개년 영업이익 변화 추이를 보여주세요', icon: '📈' },
  { label: '현금흐름', query: '영업활동 현금흐름과 투자활동 현금흐름을 알려주세요', icon: '💵' },
  { label: '재무상태표', query: '최신 재무상태표의 주요 항목을 요약해주세요', icon: '💼' },
  { label: '부채비율', query: '현재 부채비율과 자본 구조를 분석해주세요', icon: '📊' },
  { label: '연구개발비', query: '최근 연구개발비 투자 규모와 매출 대비 비율을 보여주세요', icon: '🔬' },
];

export default function ChatInterface({ language = 'en' }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAllQueries, setShowAllQueries] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const queries = language === 'ko' ? KOREAN_QUERIES : ENGLISH_QUERIES;
  const displayedQueries = showAllQueries ? queries : queries.slice(0, 3);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleQuickQuery = (query: string) => {
    setInput(query);
    handleSubmit(null, query);
  };

  const handleSubmit = async (e?: React.FormEvent | null, directQuery?: string) => {
    if (e) e.preventDefault();
    const queryText = directQuery || input;
    if (!queryText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: queryText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: queryText,
          language: language,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          searchResults: data.searchResults,
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                <p className="text-lg font-medium text-gray-700">
                  {language === 'ko' ? '무엇을 도와드릴까요?' : 'How can I help you today?'}
                </p>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                {language === 'ko' 
                  ? '재무 데이터에 대해 물어보세요'
                  : 'Ask me about financial data'}
              </p>
            </div>
          ) : (
            messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <Card
                  className={`max-w-[80%] p-3 ${
                    message.role === 'user' 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Badge variant={message.role === 'user' ? 'default' : 'secondary'}>
                      {message.role === 'user' ? 'You' : 'Assistant'}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.searchResults && message.searchResults.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          Found {message.searchResults.length} relevant tables
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </Card>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <Card className="p-3 bg-gray-50 border-gray-200">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Assistant</Badge>
                  <div className="flex gap-1">
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce delay-100">●</span>
                    <span className="animate-bounce delay-200">●</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Query Pills - Show when chat is empty or minimal */}
      {messages.length === 0 && (
        <div className="border-t px-4 pt-3 pb-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-gray-600">
              {language === 'ko' ? '빠른 질문' : 'Quick queries'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {displayedQueries.map((query, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuery(query.query)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                         bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm
                         transition-colors duration-200 group"
              >
                <span className="text-base">{query.icon}</span>
                <span>{query.label}</span>
                <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
            {!showAllQueries && queries.length > 3 && (
              <button
                onClick={() => setShowAllQueries(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full
                         bg-transparent hover:bg-gray-100 text-gray-600 text-sm
                         transition-colors duration-200"
              >
                <span>+{queries.length - 3} more</span>
              </button>
            )}
            {showAllQueries && (
              <button
                onClick={() => setShowAllQueries(false)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full
                         bg-transparent hover:bg-gray-100 text-gray-600 text-sm
                         transition-colors duration-200"
              >
                <span>Show less</span>
              </button>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={language === 'ko' 
              ? "재무 데이터에 대해 물어보세요..."
              : "Ask about financial data..."}
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="self-end"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  );
}