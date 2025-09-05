export interface ChatSession {
  id: string;
  title: string;
  timestamp: number;
  messages: unknown[];
  language: 'en' | 'ko';
}

const MAX_HISTORY_ITEMS = 20;
const HISTORY_KEY = 'chatHistory';

export function getChatHistory(): ChatSession[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];
    
    const history = JSON.parse(stored);
    // Sort by timestamp, most recent first
    return history.sort((a: ChatSession, b: ChatSession) => b.timestamp - a.timestamp);
  } catch (e) {
    console.error('Failed to load chat history:', e);
    return [];
  }
}

export function saveChatSession(session: ChatSession): void {
  if (typeof window === 'undefined') return;
  
  try {
    const history = getChatHistory();
    
    // Check if this session already exists (update) or is new (add)
    const existingIndex = history.findIndex(s => s.id === session.id);
    
    if (existingIndex >= 0) {
      // Update existing session
      history[existingIndex] = session;
    } else {
      // Add new session to the beginning
      history.unshift(session);
    }
    
    // Keep only the most recent sessions
    const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory));
  } catch (e) {
    console.error('Failed to save chat session:', e);
  }
}

export function deleteChatSession(sessionId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const history = getChatHistory();
    const filtered = history.filter(s => s.id !== sessionId);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete chat session:', e);
  }
}

export function generateChatTitle(messages: unknown[], language: 'en' | 'ko'): string {
  if (messages.length === 0) {
    return language === 'ko' ? '새 대화' : 'New Chat';
  }
  
  // Get the first user message
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const firstUserMessage = messages.find((m: any) => m.role === 'user');
  if (!firstUserMessage) {
    return language === 'ko' ? '새 대화' : 'New Chat';
  }
  
  // Truncate to first 50 characters or first sentence
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let title = (firstUserMessage as any).content || '';
  const maxLength = 50;
  
  if (title.length > maxLength) {
    title = title.substring(0, maxLength) + '...';
  } else {
    // Try to cut at sentence end if shorter than max
    const sentenceEnd = title.search(/[.!?]/);
    if (sentenceEnd > 0 && sentenceEnd < maxLength) {
      title = title.substring(0, sentenceEnd + 1);
    }
  }
  
  return title;
}

export function formatRelativeTime(timestamp: number, language: 'en' | 'ko'): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (language === 'ko') {
    if (minutes < 1) return '방금';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days === 1) return '어제';
    if (days < 7) return `${days}일 전`;
    if (days < 30) return `${Math.floor(days / 7)}주 전`;
    return `${Math.floor(days / 30)}달 전`;
  } else {
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  }
}