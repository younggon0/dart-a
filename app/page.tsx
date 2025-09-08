'use client';

import { useState } from 'react';
import EarningsQualityInterface from '@/components/earnings/EarningsQualityInterface';
import { TrendingUp } from 'lucide-react';

export default function Home() {
  const [language, setLanguage] = useState<'en' | 'ko'>('en');

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Earnings Quality Analyzer</h1>
                <p className="text-xs text-gray-500">AI-Powered Financial Forensics</p>
              </div>
            </div>
            
            {/* Language Toggle */}
            <div className="bg-gray-100 rounded-full p-1 flex gap-1">
              <button
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                  language === 'en' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setLanguage('en')}
              >
                EN
              </button>
              <button
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                  language === 'ko' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setLanguage('ko')}
              >
                KO
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <EarningsQualityInterface language={language} />
      </div>
    </main>
  );
}