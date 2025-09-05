'use client';

import { useState } from 'react';
import ChatInterface from '@/components/chat/ChatInterface';
import CompanySelector from '@/components/company/CompanySelector';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [selectedCompany, setSelectedCompany] = useState<{ name: string; code: string } | null>(null);
  const [language, setLanguage] = useState<'en' | 'ko'>('en');


  return (
    <main className="flex min-h-screen flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">DART-E Intelligence Platform</h1>
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
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 border-r bg-sidebar/50 backdrop-blur-sm p-6 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Data Source</h3>
              <CompanySelector
                selectedCompany={selectedCompany || undefined}
                onCompanyChange={setSelectedCompany}
              />
            </div>
          </div>
        </aside>
        
        <div className="flex-1 overflow-hidden">
          <ChatInterface language={language} />
        </div>
      </div>
    </main>
  );
}