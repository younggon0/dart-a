/**
 * Session management utilities for maintaining conversation context
 */

export interface SessionMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Session {
  id: string;
  messages: SessionMessage[];
  createdAt: number;
  lastActivity: number;
}

// In-memory session store (could be replaced with Redis later)
const sessions = new Map<string, Session>();

/**
 * Generate a new session ID
 */
export function generateSessionId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

/**
 * Get or create a session
 */
export function getSession(sessionId: string): Session {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      id: sessionId,
      messages: [],
      createdAt: Date.now(),
      lastActivity: Date.now(),
    });
  }
  
  const session = sessions.get(sessionId)!;
  session.lastActivity = Date.now();
  return session;
}

/**
 * Add message to session history
 */
export function addToSession(
  sessionId: string, 
  role: 'user' | 'assistant', 
  content: string
): void {
  const session = getSession(sessionId);
  session.messages.push({
    role,
    content,
    timestamp: Date.now(),
  });
  
  // Keep only last 20 messages to prevent memory issues
  if (session.messages.length > 20) {
    session.messages = session.messages.slice(-20);
  }
}

/**
 * Get recent conversation history
 */
export function getRecentHistory(sessionId: string, count: number = 3): SessionMessage[] {
  const session = sessions.get(sessionId);
  if (!session) return [];
  
  return session.messages.slice(-count * 2); // Get last N exchanges (user + assistant)
}

/**
 * Check if query needs context from conversation history
 */
export function needsContext(query: string): boolean {
  const lower = query.toLowerCase();
  
  // Pronouns that reference previous content
  const pronouns = [
    'that', 'this', 'it', 'they', 'them', 'those', 'these',
    'the same', 'above', 'previous', 'earlier', 'last',
    'what about', 'how about', 'and also', 'additionally',
    'more', 'tell me more', 'explain further', 'elaborate'
  ];
  
  // Korean context references
  const koreanRefs = [
    '그것', '이것', '그거', '이거', '위의', '위에',
    '앞서', '이전', '더', '추가로', '또한', '그리고'
  ];
  
  return pronouns.some(p => lower.includes(p)) || 
         koreanRefs.some(k => query.includes(k));
}

/**
 * Build context with conversation history
 */
export function buildContextWithHistory(
  baseContext: string,
  sessionId: string,
  currentQuery: string
): string {
  // Only add history if query needs context
  if (!needsContext(currentQuery)) {
    return baseContext;
  }
  
  const history = getRecentHistory(sessionId, 2);
  if (history.length === 0) {
    return baseContext;
  }
  
  // Format conversation history
  const historyContext = history.map(msg => 
    `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
  ).join('\n');
  
  return `Previous conversation:
${historyContext}

Current context:
${baseContext}`;
}

/**
 * Clean up old sessions (call periodically)
 */
export function cleanupOldSessions(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.lastActivity > maxAgeMs) {
      sessions.delete(id);
    }
  }
}

/**
 * Get session statistics
 */
export function getSessionStats() {
  return {
    activeSessions: sessions.size,
    totalMessages: Array.from(sessions.values()).reduce(
      (sum, session) => sum + session.messages.length, 0
    ),
  };
}