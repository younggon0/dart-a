'use client';

import { useState } from 'react';
import ChatInterface from '@/components/chat/ChatInterface';
import SearchResults from '@/components/search/SearchResults';
import QuickQueries from '@/components/common/QuickQueries';
import CompanySelector from '@/components/company/CompanySelector';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Home() {
  const [activeTab, setActiveTab] = useState('chat');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [language, setLanguage] = useState<'en' | 'ko'>('en');
  const [selectedQuery, setSelectedQuery] = useState<string>('');

  const handleQuickQuery = (query: string) => {
    setSelectedQuery(query);
    setActiveTab('chat'); // Switch to chat tab
  };

  const handleSearch = async (keywords: string[]) => {
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          corpCode: selectedCompany?.code || '00126380',
          keywords,
          limit: 10,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.data);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

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
              selectedCompany={selectedCompany}
              onCompanyChange={setSelectedCompany}
            />
            
            <QuickQueries 
              onQuerySelect={handleQuickQuery}
              language={language}
            />
          </div>
        </aside>
        
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="border-b px-6">
              <TabsList className="h-12">
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="search">Search Results</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <TabsContent value="chat" className="h-full m-0">
                <ChatInterface 
                  initialQuery={selectedQuery}
                  onQueryProcessed={() => setSelectedQuery('')}
                />
              </TabsContent>
              
              <TabsContent value="search" className="h-full m-0 p-6 overflow-y-auto">
                <SearchResults 
                  results={searchResults}
                  isLoading={false}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </main>
  );
}