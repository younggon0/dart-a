'use client';

import { useState, useEffect } from 'react';
import ChatInterface from '@/components/chat/ChatInterface';
import CompanySelector from '@/components/company/CompanySelector';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { Button } from '@/components/ui/button';
import { TrendingUp, Menu, X, History, BarChart3, FileText, Settings, Download, Trash2 } from 'lucide-react';
import { getChatHistory, deleteChatSession, formatRelativeTime, ChatSession } from '@/lib/chatHistory';

export default function Home() {
  const [selectedCompany, setSelectedCompany] = useState<{ name: string; code: string } | null>(null);
  const [language, setLanguage] = useState<'en' | 'ko'>('en');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Load messages and chat history on mount
  useEffect(() => {
    const storedMessages = localStorage.getItem('chatMessages');
    if (storedMessages) {
      try {
        const parsed = JSON.parse(storedMessages);
        setMessages(parsed);
      } catch (e) {
        console.error('Failed to load messages:', e);
      }
    }
    
    // Load chat history
    loadChatHistory();
    
    // Refresh chat history periodically
    const interval = setInterval(loadChatHistory, 5000); // Every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadChatHistory = () => {
    const history = getChatHistory();
    setChatHistory(history);
  };

  const handleLoadSession = (sessionId: string) => {
    console.log('Loading session:', sessionId);
    
    // Toggle the selectedSessionId to force re-trigger the effect
    setSelectedSessionId(null);
    setTimeout(() => {
      setSelectedSessionId(sessionId);
    }, 10);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the load action
    if (confirm(language === 'ko' ? '이 대화를 삭제하시겠습니까?' : 'Delete this chat?')) {
      deleteChatSession(sessionId);
      loadChatHistory();
    }
  };

  const handleNewChat = () => {
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
    localStorage.setItem('chatSessionId', newSessionId);
    
    // Clear selected session
    setSelectedSessionId(null);
  };

  // Export chat functionality
  const handleExportChat = () => {
    if (messages.length === 0) {
      alert(language === 'ko' ? '내보낼 대화가 없습니다.' : 'No chat to export.');
      return;
    }

    // Format messages as markdown
    const markdown = messages.map(msg => {
      const role = msg.role === 'user' ? '**You**' : '**Assistant**';
      const time = new Date(msg.timestamp).toLocaleString();
      return `${role} (${time}):\n${msg.content}\n`;
    }).join('\n---\n\n');

    // Create blob and download
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dart-e-chat-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  return (
    <main className="flex min-h-screen flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-border/50 shadow-sm z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Sidebar Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-muted transition-all duration-200 group"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5 transition-transform duration-200 group-hover:rotate-90" />
              ) : (
                <Menu className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
              )}
            </button>
            
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-md">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">DART-E Intelligence</h1>
                <p className="text-xs text-muted-foreground">Financial Analytics Platform</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
              <div className="bg-muted rounded-full p-1 flex gap-1">
                <Button
                  variant={language === 'en' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setLanguage('en')}
                  className={language === 'en' ? 'rounded-full shadow-sm' : 'rounded-full'}
                >
                  English
                </Button>
                <Button
                  variant={language === 'ko' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setLanguage('ko')}
                  className={language === 'ko' ? 'rounded-full shadow-sm' : 'rounded-full'}
                >
                  한국어
                </Button>
              </div>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Collapsible Sidebar */}
        <aside 
          className={`${
            sidebarOpen ? 'w-72' : 'w-0'
          } border-r bg-white/95 backdrop-blur-sm overflow-hidden transition-all duration-300 ease-in-out shadow-sm`}
        >
          <div className={`${sidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200 h-full overflow-y-auto`}>
            <div className="p-6">
            <div className="space-y-6">
              {/* Data Source Section */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Data Source
                </h3>
                <CompanySelector
                  selectedCompany={selectedCompany || undefined}
                  onCompanyChange={setSelectedCompany}
                />
              </div>

              {/* Quick Stats Section */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Quick Stats
                </h3>
                <div className="space-y-2">
                  <div className="stats-card-blue p-3 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200/50 hover:shadow-md transition-all duration-200 cursor-pointer group">
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Revenue (2024)</div>
                    <div className="text-lg font-bold text-blue-900 dark:text-blue-200 group-hover:scale-105 transition-transform duration-200 origin-left">₩300.87T</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">+16.2% YoY</div>
                  </div>
                  <div className="stats-card-green p-3 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl border border-green-200/50 hover:shadow-md transition-all duration-200 cursor-pointer group">
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium">Operating Profit</div>
                    <div className="text-lg font-bold text-green-900 dark:text-green-200 group-hover:scale-105 transition-transform duration-200 origin-left">₩32.73T</div>
                    <div className="text-xs text-green-600 dark:text-green-400">+398.5% YoY</div>
                  </div>
                </div>
              </div>

              {/* Chat History Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <History className="h-3.5 w-3.5" />
                    Recent Chats
                  </h3>
                  <button
                    onClick={handleNewChat}
                    className="text-xs text-primary hover:text-primary/80 font-medium"
                  >
                    + New
                  </button>
                </div>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {chatHistory.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-4">
                      {language === 'ko' ? '저장된 대화가 없습니다' : 'No saved chats'}
                    </div>
                  ) : (
                    chatHistory.slice(0, 10).map((session) => (
                      <div
                        key={session.id}
                        className="chat-history-item group relative"
                      >
                        <button
                          onClick={() => handleLoadSession(session.id)}
                          className="w-full text-left p-2.5 pr-8 hover:bg-muted rounded-lg transition-colors text-sm text-muted-foreground"
                        >
                          <div className="font-medium text-foreground truncate pr-2">
                            {session.title}
                          </div>
                          <div className="text-xs opacity-75">
                            {formatRelativeTime(session.timestamp, language)}
                          </div>
                        </button>
                        <button
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                          title={language === 'ko' ? '삭제' : 'Delete'}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Settings className="h-3.5 w-3.5" />
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <button 
                    onClick={handleExportChat}
                    className="w-full flex items-center gap-2 p-2.5 hover:bg-muted rounded-lg transition-colors text-sm"
                  >
                    <Download className="h-4 w-4" />
                    Export Chat
                  </button>
                  <button 
                    onClick={() => setSettingsOpen(true)}
                    className="w-full flex items-center gap-2 p-2.5 hover:bg-muted rounded-lg transition-colors text-sm"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                </div>
              </div>
            </div>
            </div>
          </div>
        </aside>
        
        <div className="flex-1 overflow-hidden">
          <ChatInterface 
            language={language} 
            onMessagesChange={setMessages}
            loadSessionId={selectedSessionId}
          />
        </div>
      </div>
      
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        language={language}
        onLanguageChange={setLanguage}
      />
    </main>
  );
}