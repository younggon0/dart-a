export const translations = {
  en: {
    header: {
      title: "DART-E Intelligence",
      subtitle: "Financial Analytics Platform",
      languageToggle: {
        english: "English",
        korean: "한국어"
      }
    },
    sidebar: {
      dataSource: "Data Source",
      company: "Company",
      recentChats: "Recent Chats",
      newChat: "+ New",
      noSavedChats: "No saved chats",
      quickActions: "Quick Actions",
      exportChat: "Export Chat",
      settings: "Settings",
      delete: "Delete"
    },
    chat: {
      send: "Send",
      sending: "Sending...",
      thinking: "Thinking",
      showLess: "Show less",
      showMore: (count: number) => `+${count} more`,
      viewSources: (count: number) => `View Sources (${count})`,
      howCanIHelp: "How can I help you today?",
      askAboutFinancialData: "Ask me about Samsung Electronics financial data",
      quickQueries: "Quick queries",
      placeholder: "Ask about financial data...",
      errorMessage: "Sorry, I encountered an error processing your request.",
      noChatsToExport: "No chat to export."
    },
    settings: {
      title: "Settings",
      theme: "Theme",
      darkMode: "Dark Mode",
      language: "Language",
      interfaceLanguage: "Interface Language",
      export: "Export",
      autoExport: "Auto-export on new chat",
      about: "About",
      version: "DART-E Intelligence v1.0",
      description: "Korean Financial Data Analytics Platform",
      close: "Close"
    },
    companies: {
      samsungElectronics: "Samsung Electronics"
    }
  },
  ko: {
    header: {
      title: "DART-E Intelligence",
      subtitle: "금융 분석 플랫폼",
      languageToggle: {
        english: "English",
        korean: "한국어"
      }
    },
    sidebar: {
      dataSource: "데이터 소스",
      company: "회사",
      recentChats: "최근 대화",
      newChat: "+ 새 대화",
      noSavedChats: "저장된 대화가 없습니다",
      quickActions: "빠른 작업",
      exportChat: "대화 내보내기",
      settings: "설정",
      delete: "삭제"
    },
    chat: {
      send: "전송",
      sending: "전송 중...",
      thinking: "생각 중",
      showLess: "접기",
      showMore: (count: number) => `+${count}개 더보기`,
      viewSources: (count: number) => `출처 보기 (${count})`,
      howCanIHelp: "무엇을 도와드릴까요?",
      askAboutFinancialData: "삼성전자의 재무 데이터에 대해 물어보세요",
      quickQueries: "빠른 질문",
      placeholder: "재무 데이터에 대해 물어보세요...",
      errorMessage: "죄송합니다. 요청을 처리하는 중 오류가 발생했습니다.",
      noChatsToExport: "내보낼 대화가 없습니다."
    },
    settings: {
      title: "설정",
      theme: "테마",
      darkMode: "다크 모드",
      language: "언어",
      interfaceLanguage: "인터페이스 언어",
      export: "내보내기",
      autoExport: "새 대화 시작 시 자동 내보내기",
      about: "정보",
      version: "DART-E Intelligence v1.0",
      description: "한국 금융 데이터 분석 플랫폼",
      close: "닫기"
    },
    companies: {
      samsungElectronics: "삼성전자"
    }
  }
} as const;

export type Language = keyof typeof translations;
export type TranslationKeys = typeof translations['en'];

export function useTranslation(language: Language) {
  return translations[language];
}

// Helper function for formatting dates/times in locale-specific way
export function formatTimestamp(timestamp: Date | string, language: Language): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  
  if (language === 'ko') {
    // Korean typically uses 24-hour format
    return date.toLocaleTimeString('ko-KR', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } else {
    // English uses 12-hour format with AM/PM
    return date.toLocaleTimeString('en-US', { 
      hour12: true
    });
  }
}