'use client';

import { useState, useEffect } from 'react';
import ChatInterface from '@/components/chat/ChatInterface';
import CompanySelector from '@/components/company/CompanySelector';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { Button } from '@/components/ui/button';
import { TrendingUp, History, BarChart3, Settings, Download, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getChatHistory, deleteChatSession, formatRelativeTime, ChatSession } from '@/lib/chatHistory';
import { useTranslation } from '@/lib/translations';

export default function Home() {
  const [selectedCompany, setSelectedCompany] = useState<{ name: string; code: string } | null>(null);
  const [language, setLanguage] = useState<'en' | 'ko'>('en');
  const t = useTranslation(language);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  interface Message {
    role: string;
    content: string;
    timestamp: string | Date;
  }
  const [messages, setMessages] = useState<Message[]>([]);
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
    console.log('Creating new chat...');
    
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
    
    // Trigger a special session ID to signal new chat
    setSelectedSessionId('NEW_CHAT_' + newSessionId);
  };

  // Export chat functionality
  const handleExportChat = () => {
    if (messages.length === 0) {
      alert(t.chat.noChatsToExport);
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
          <div className="flex items-center gap-3">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-md">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{t.header.title}</h1>
                <p className="text-xs text-muted-foreground">{t.header.subtitle}</p>
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
                  {t.header.languageToggle.english}
                </Button>
                <Button
                  variant={language === 'ko' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setLanguage('ko')}
                  className={language === 'ko' ? 'rounded-full shadow-sm' : 'rounded-full'}
                >
                  {t.header.languageToggle.korean}
                </Button>
              </div>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Collapsible Sidebar */}
        <aside 
          className={`${
            sidebarOpen ? 'w-72' : 'w-0'
          } border-r bg-white/95 backdrop-blur-sm overflow-hidden transition-all duration-300 ease-in-out shadow-sm relative`}
        >
          <div className={`${sidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200 h-full overflow-y-auto`}>
            <div className="p-6">
            <div className="space-y-8">
              {/* Data Source Section */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <BarChart3 className="h-3.5 w-3.5" />
                  {t.sidebar.dataSource}
                </h3>
                <CompanySelector
                  language={language}
                  selectedCompany={selectedCompany || undefined}
                  onCompanyChange={setSelectedCompany}
                />
              </div>

              {/* Chat History Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <History className="h-3.5 w-3.5" />
                    {t.sidebar.recentChats}
                  </h3>
                  <button
                    onClick={handleNewChat}
                    className="text-xs text-primary hover:text-primary/80 font-medium"
                  >
                    {t.sidebar.newChat}
                  </button>
                </div>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {chatHistory.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-4">
                      {t.sidebar.noSavedChats}
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
                          title={t.sidebar.delete}
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
                  {t.sidebar.quickActions}
                </h3>
                <div className="space-y-2">
                  <button 
                    onClick={handleExportChat}
                    className="w-full flex items-center gap-2 p-2.5 hover:bg-muted rounded-lg transition-colors text-sm"
                  >
                    <Download className="h-4 w-4" />
                    {t.sidebar.exportChat}
                  </button>
                  <button 
                    onClick={() => setSettingsOpen(true)}
                    className="w-full flex items-center gap-2 p-2.5 hover:bg-muted rounded-lg transition-colors text-sm"
                  >
                    <Settings className="h-4 w-4" />
                    {t.sidebar.settings}
                  </button>
                </div>
              </div>
            </div>
            </div>
          </div>
          
          {/* Sidebar Toggle Button - Floating Edge Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`absolute top-[50vh] -translate-y-1/2 -right-3 z-10 bg-primary dark:bg-primary/80 text-primary-foreground
              rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 group hover:scale-110
              ${!sidebarOpen ? 'translate-x-0' : ''}`}
            aria-label="Toggle sidebar"
          >
            <ChevronLeft className="h-4 w-4 transition-transform duration-200" />
          </button>
        </aside>
        
        {/* Floating Toggle Button for Closed Sidebar */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute left-3 top-[50vh] -translate-y-1/2 z-20 bg-primary dark:bg-primary/80 text-primary-foreground
              rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 group hover:scale-110
              animate-fade-in"
            aria-label="Open sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
        
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