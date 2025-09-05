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
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">DART-E Intelligence Platform</h1>
            <div className="flex gap-2">
              <Button
                variant={language === 'en' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLanguage('en')}
              >
                English
              </Button>
              <Button
                variant={language === 'ko' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLanguage('ko')}
              >
                한국어
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 border-r bg-gray-50 p-4 overflow-y-auto">
          <div className="space-y-4">
            <CompanySelector
              selectedCompany={selectedCompany || undefined}
              onCompanyChange={setSelectedCompany}
            />
          </div>
        </aside>
        
        <div className="flex-1 overflow-hidden">
          <ChatInterface language={language} />
        </div>
      </div>
    </main>
  );
}