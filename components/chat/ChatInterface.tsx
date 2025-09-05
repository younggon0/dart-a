'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Sparkles, User, Bot } from 'lucide-react';
import { SourcePanel } from '@/components/sources/SourcePanel';
import { SourceReference } from '@/types/source';
import { saveChatSession, generateChatTitle, ChatSession } from '@/lib/chatHistory';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  searchResults?: unknown[];
  sources?: SourceReference[];
}

interface QuickQuery {
  label: string;
  query: string;
  icon?: string;
}

interface ChatInterfaceProps {
  language?: 'en' | 'ko';
  onMessagesChange?: (messages: Message[]) => void;
  loadSessionId?: string | null;
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

export default function ChatInterface({ 
  language = 'en', 
  onMessagesChange,
  loadSessionId
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAllQueries, setShowAllQueries] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const queries = language === 'ko' ? KOREAN_QUERIES : ENGLISH_QUERIES;
  const displayedQueries = showAllQueries ? queries : queries.slice(0, 3);

  // Initialize session on mount
  useEffect(() => {
    // Check for existing session in localStorage
    const storedSessionId = localStorage.getItem('chatSessionId');
    const storedMessages = localStorage.getItem('chatMessages');
    
    if (storedSessionId) {
      setSessionId(storedSessionId);
      
      // Restore messages if they exist
      if (storedMessages) {
        try {
          const parsed = JSON.parse(storedMessages);
          setMessages(parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })));
        } catch (e) {
          console.error('Failed to restore messages:', e);
        }
      }
    } else {
      // Generate new session ID
      const newSessionId = crypto.randomUUID ? crypto.randomUUID() : 
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      setSessionId(newSessionId);
      localStorage.setItem('chatSessionId', newSessionId);
    }
  }, []);

  // Handle loading a specific session or creating new chat
  useEffect(() => {
    if (loadSessionId) {
      console.log('ChatInterface loading session:', loadSessionId);
      
      // Check if this is a new chat signal
      if (loadSessionId.startsWith('NEW_CHAT_')) {
        const newSessionId = loadSessionId.replace('NEW_CHAT_', '');
        console.log('Creating new chat with ID:', newSessionId);
        
        // Clear everything
        setMessages([]);
        setSessionId(newSessionId);
        setInput('');
        setShowAllQueries(false);
        localStorage.setItem('chatSessionId', newSessionId);
        localStorage.removeItem('chatMessages');
        return;
      }
      
      // Otherwise load existing session
      const history = localStorage.getItem('chatHistory');
      if (history) {
        try {
          const sessions = JSON.parse(history);
          const session = sessions.find((s: ChatSession) => s.id === loadSessionId);
          if (session) {
            console.log('Found session, loading messages:', session.messages.length);
            // Parse timestamps when loading from history
            const messagesWithDates = session.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }));
            setMessages(messagesWithDates);
            setSessionId(session.id);
            localStorage.setItem('chatSessionId', session.id);
            localStorage.setItem('chatMessages', JSON.stringify(session.messages));
            
            // Clear input and reset UI
            setInput('');
            setShowAllQueries(false);
          } else {
            console.log('Session not found in history');
          }
        } catch (e) {
          console.error('Failed to load session:', e);
        }
      }
    }
  }, [loadSessionId]);

  // Save messages to localStorage and history whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
      
      // Save to chat history
      const session: ChatSession = {
        id: sessionId,
        title: generateChatTitle(messages, language),
        timestamp: Date.now(),
        messages: messages,
        language: language
      };
      saveChatSession(session);
    }
    // Notify parent component of message changes
    if (onMessagesChange) {
      onMessagesChange(messages);
    }
  }, [messages, onMessagesChange, sessionId, language]);

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

  const handleClearChat = () => {
    // Clear messages
    setMessages([]);
    localStorage.removeItem('chatMessages');
    
    // Generate new session ID
    const newSessionId = crypto.randomUUID ? crypto.randomUUID() : 
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    setSessionId(newSessionId);
    localStorage.setItem('chatSessionId', newSessionId);
    
    // Reset UI state
    setInput('');
    setShowAllQueries(false);
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
          sessionId: sessionId,
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
          sources: data.sources,
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
    <div className="flex flex-col h-full relative">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-center max-w-md mx-auto">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl mx-auto flex items-center justify-center shadow-lg">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {language === 'ko' ? '무엇을 도와드릴까요?' : 'How can I help you today?'}
                </h2>
                <p className="text-muted-foreground mb-8">
                  {language === 'ko' 
                    ? '삼성전자의 재무 데이터에 대해 물어보세요'
                    : 'Ask me about Samsung Electronics financial data'}
                </p>
              </div>
            </div>
          ) : (
            messages.map(message => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-accent text-accent-foreground'
                }`}>
                  {message.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>

                {/* Message Content */}
                <div
                  className={`max-w-[70%] ${
                    message.role === 'user' 
                      ? 'message-user' 
                      : 'message-assistant'
                  }`}
                >
                  <div className="p-4">
                    <p className={`text-sm whitespace-pre-wrap leading-relaxed ${message.role === 'user' ? 'text-white' : 'text-foreground'}`}>
                      {message.content}
                    </p>
                    {message.sources && message.sources.length > 0 && (
                      <SourcePanel 
                        sources={message.sources}
                        variant="expandable"
                        className="mt-3"
                      />
                    )}
                    <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/70' : 'text-muted-foreground'}`}>
                      {message.timestamp instanceof Date 
                        ? message.timestamp.toLocaleTimeString() 
                        : new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Avatar */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-accent text-accent-foreground">
                <Bot className="h-4 w-4" />
              </div>
              
              {/* Typing Indicator */}
              <div className="message-assistant max-w-[70%]">
                <div className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Thinking</span>
                    <div className="flex gap-1">
                      <span className="inline-block w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse"></span>
                      <span className="inline-block w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse [animation-delay:200ms]"></span>
                      <span className="inline-block w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse [animation-delay:400ms]"></span>
                    </div>
                  </div>
                </div>
              </div>
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
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
                         bg-white border border-border hover:border-primary/50 hover:bg-primary/5
                         text-foreground text-sm font-medium
                         transition-all duration-200 group shadow-sm hover:shadow-md"
              >
                <span className="text-lg">{query.icon}</span>
                <span>{query.label}</span>
                <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" />
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

      <form onSubmit={handleSubmit} className="border-t bg-white/50 backdrop-blur-sm p-4">
        <div className="flex gap-3">
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
            className="min-h-[60px] resize-none rounded-xl border-border/50 bg-white/80 focus:bg-white transition-all"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="self-end rounded-xl px-6 shadow-sm hover:shadow-md transition-all"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </form>

    </div>
  );
}