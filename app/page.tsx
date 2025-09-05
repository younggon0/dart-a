'use client';

import { useState, useEffect } from 'react';
import ChatInterface from '@/components/chat/ChatInterface';
import CompanySelector from '@/components/company/CompanySelector';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { Button } from '@/components/ui/button';
import { TrendingUp, Menu, X, History, BarChart3, FileText, Settings, Download } from 'lucide-react';

export default function Home() {
  const [selectedCompany, setSelectedCompany] = useState<{ name: string; code: string } | null>(null);
  const [language, setLanguage] = useState<'en' | 'ko'>('en');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Load messages from localStorage on mount
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
  }, []);

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
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <History className="h-3.5 w-3.5" />
                  Recent Chats
                </h3>
                <div className="space-y-1">
                  <button className="chat-history-item w-full text-left p-2.5 hover:bg-muted rounded-lg transition-colors text-sm text-muted-foreground">
                    <div className="font-medium text-foreground truncate">Revenue Analysis</div>
                    <div className="text-xs opacity-75">2 hours ago</div>
                  </button>
                  <button className="chat-history-item w-full text-left p-2.5 hover:bg-muted rounded-lg transition-colors text-sm text-muted-foreground">
                    <div className="font-medium text-foreground truncate">Cash Flow Statement</div>
                    <div className="text-xs opacity-75">Yesterday</div>
                  </button>
                  <button className="chat-history-item w-full text-left p-2.5 hover:bg-muted rounded-lg transition-colors text-sm text-muted-foreground">
                    <div className="font-medium text-foreground truncate">Balance Sheet Review</div>
                    <div className="text-xs opacity-75">2 days ago</div>
                  </button>
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