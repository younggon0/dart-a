'use client';

import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AgentMessage } from '@/lib/agents/types';
import { Brain, Bot, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface AgentChatLogProps {
  messages: AgentMessage[];
  language: 'en' | 'ko';
}

export default function AgentChatLog({ messages, language }: AgentChatLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const translations = {
    en: {
      title: 'Agent Communications',
      thinking: 'Thinking',
      decision: 'Decision',
      status: 'Status',
      result: 'Result',
      error: 'Error',
    },
    ko: {
      title: '에이전트 통신',
      thinking: '사고 중',
      decision: '결정',
      status: '상태',
      result: '결과',
      error: '오류',
    },
  };

  const t = translations[language];

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getMessageIcon = (type: AgentMessage['type']) => {
    switch (type) {
      case 'thinking':
        return <Brain className="h-3 w-3" />;
      case 'decision':
        return <CheckCircle className="h-3 w-3" />;
      case 'status':
        return <Info className="h-3 w-3" />;
      case 'result':
        return <CheckCircle className="h-3 w-3" />;
      case 'error':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Bot className="h-3 w-3" />;
    }
  };

  const getMessageStyle = (type: AgentMessage['type']) => {
    switch (type) {
      case 'thinking':
        return 'bg-gray-50 border-gray-200 text-gray-700';
      case 'decision':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'status':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'result':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-900';
      default:
        return 'bg-white border-gray-200 text-gray-900';
    }
  };

  const getAgentColor = (agent: string) => {
    if (agent.includes('Master')) return 'text-purple-600';
    if (agent.includes('Data')) return 'text-blue-600';
    if (agent.includes('Calculation')) return 'text-green-600';
    if (agent.includes('Assessment')) return 'text-orange-600';
    if (agent.includes('Validation')) return 'text-red-600';
    return 'text-gray-600';
  };

  // Removed formatTime function - no longer showing timestamps

  if (messages.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 bg-white h-64">
      <div className="mb-3">
        <h3 className="font-semibold text-gray-900">{t.title}</h3>
      </div>
      
      <ScrollArea className="h-48" ref={scrollRef}>
        <div className="space-y-2 pr-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-lg border p-2 text-xs ${getMessageStyle(message.type)}`}
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  {getMessageIcon(message.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-medium ${getAgentColor(message.from)}`}>
                      {message.from}
                    </span>
                    {message.to && (
                      <>
                        <span className="text-gray-400">→</span>
                        <span className={`font-medium ${getAgentColor(message.to)}`}>
                          {message.to}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-gray-700 break-words">{message.content}</p>
                  
                  {(() => {
                    if (!message.metadata) return null;
                    const metadata = message.metadata as { 
                      requirements?: unknown[]; 
                      agents?: unknown[]; 
                      estimatedTime?: number 
                    };
                    
                    return (
                      <div className="mt-1 pt-1 border-t border-gray-200">
                        {metadata.requirements && (
                          <div className="text-xs text-gray-500">
                            {metadata.requirements.length} requirements identified
                          </div>
                        )}
                        {metadata.agents && (
                          <div className="text-xs text-gray-500">
                            {metadata.agents.length} agents required
                          </div>
                        )}
                        {metadata.estimatedTime && (
                          <div className="text-xs text-gray-500">
                            Est. time: {(metadata.estimatedTime / 1000).toFixed(1)}s
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}