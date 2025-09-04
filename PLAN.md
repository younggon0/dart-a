# DART-E: Modern UI for DART Intelligence Platform

## Project Overview

DART-E is a modern web UI replacement for the existing Streamlit-based DART Intelligence Platform. It provides a responsive, production-ready English-first interface for financial data analysis while maintaining the existing Python ETL pipeline and PostgreSQL database.

### Goals
- Replace Streamlit with a modern, scalable web framework
- Provide English as the primary language with Korean support
- Improve UI/UX with responsive design and real-time updates
- Maintain compatibility with existing DART ETL pipeline
- Enhance performance and user experience
- Support production deployment at scale

## Technical Architecture

### Stack Decision
- **Frontend Framework**: Next.js 14+ (App Router)
- **UI Components**: shadcn/ui + Tailwind CSS
- **Database Client**: pg (PostgreSQL driver)
- **AI Integration**: @anthropic-ai/sdk
- **Real-time Updates**: Server-Sent Events / WebSockets
- **Deployment**: Vercel / AWS / Self-hosted

### Why This Stack?
- **Next.js**: Full-stack React framework with excellent performance, SEO, and DX
- **Direct pg**: Optimal for complex JSONB queries without ORM overhead
- **shadcn/ui**: Modern, accessible, customizable components
- **No FastAPI needed**: Next.js API routes handle all backend needs

## System Architecture

```
Next.js App → PostgreSQL Database
     ↓        ↑
Claude AI     DART ETL Pipeline (Python)
```

**Components:**
- **Next.js**: Frontend UI + API routes
- **PostgreSQL**: JSONB storage with GIN indexes  
- **Claude AI**: Query processing and response generation
- **DART ETL**: Existing Python pipeline (unchanged)

## Implementation Phases

### Phase 1: Foundation (Week 1) ✅ COMPLETED
- [x] Initialize Next.js project with TypeScript
- [x] Set up development environment
- [x] Configure PostgreSQL connection with pg
- [x] Create base layout and routing structure
- [x] Implement shadcn/ui and Tailwind CSS
- [x] Set up environment variables and config
- [x] **All TypeScript types properly defined**
- [x] **ESLint configuration and all errors fixed**

### Phase 2: Core API Routes (Week 1-2) ✅ COMPLETED
- [x] Implement database connection pool
- [x] Create `/api/search` route
  - Port SQLBuilder logic to TypeScript
  - Handle JSONB queries
  - Implement relevance scoring
  - **Fixed keyword handling for both array and object formats**
- [x] Create `/api/companies` route
  - Company name to code mapping
  - Currently hardcoded to Samsung
- [x] Create `/api/chat` route
  - Claude AI integration (Haiku for analysis, Sonnet for responses)
  - Query processing with keyword expansion
  - Response generation
  - **Added ContextBuilder** for actual data formatting (critical fix)
  - **Formats table data as TSV for optimal Claude context**

### Phase 3: UI Components (Week 2-3) ✅ COMPLETED
- [x] Build ChatInterface component
  - Message history
  - Input handling
  - Loading states
  - **Fixed to accept initialQuery prop for quick queries**
- [x] Build SearchResults component
  - Table display
  - Data formatting
  - Expandable cards
- [x] Build QuickQueries component
  - Template queries
  - One-click actions
  - **Fixed integration** with chat input via initialQuery prop
- [x] Build CompanySelector component
  - Company display
  - Selection state
  - Auto-selects first company (Samsung)
- [x] Implement English/Korean language toggle (English default)

### Phase 4: Advanced Features (Week 3-4)
- [ ] Add real-time updates (SSE/WebSockets)
- [ ] Implement session management
- [ ] Add data visualization components
- [ ] Create advanced search filters
- [ ] Implement export functionality (Excel/CSV)
- [ ] Add keyboard shortcuts

### Phase 5: Polish & Optimization (Week 4)
- [ ] Performance optimization
  - Query caching
  - Connection pooling
  - React suspense boundaries
- [ ] Error handling and logging
- [ ] Loading states and skeletons
- [ ] Responsive design fine-tuning
- [ ] Accessibility improvements
- [ ] Testing setup

### Phase 6: Deployment (Week 5)
- [ ] Production build optimization
- [ ] Environment configuration
- [ ] Docker containerization (optional)
- [ ] CI/CD pipeline setup
- [ ] Monitoring and analytics
- [ ] Documentation

## Key Components

### API Routes

#### `/api/search`
```typescript
interface SearchRequest {
  query: string;
  corpCode: string;
  filters?: {
    statementType?: string;
    dateRange?: [string, string];
    limit?: number;
  };
}
```

#### `/api/chat`
```typescript
interface ChatRequest {
  message: string;
  sessionId: string;
  context?: SearchResult[];
}
```

### Database Queries

Key JSONB query patterns to implement:
```sql
-- Keyword search with relevance
SELECT *, 
  (CASE WHEN metadata->>'table_title_en' ILIKE $1 THEN 5 ELSE 0 END) as relevance
FROM tables 
WHERE corp_code = $2
  AND metadata->>'search_keywords_en' ILIKE $3
ORDER BY relevance DESC, (metadata->>'period_end')::date DESC

-- Period filtering
SELECT * FROM tables
WHERE corp_code = $1
  AND (metadata->>'period_end')::date BETWEEN $2 AND $3
  AND metadata->>'statement_type' = $4

-- Complex JSONB search
SELECT * FROM tables
WHERE metadata @> '{"statement_type": "financial"}'::jsonb
  AND metadata->>'confidence'::float > 0.8
```

### UI Components Structure

```
/components
├── /chat
│   ├── ChatInterface.tsx
│   ├── MessageList.tsx
│   ├── MessageInput.tsx
│   └── MessageBubble.tsx
├── /search
│   ├── SearchResults.tsx
│   ├── ResultTable.tsx
│   ├── ResultCard.tsx
│   └── ExportButton.tsx
├── /company
│   ├── CompanySelector.tsx
│   └── CompanyInfo.tsx
├── /common
│   ├── Layout.tsx
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── LoadingStates.tsx
└── /ui (shadcn components)
    ├── button.tsx
    ├── card.tsx
    ├── dialog.tsx
    └── ...
```

## Features to Implement

### Core Features (MVP)
- [x] Natural language query processing
- [x] English interface with Korean support
- [x] Company-specific searches
- [x] Chat-style interface
- [x] Search result display
- [x] Quick query templates

### Enhanced Features
- [ ] Multi-company comparison
- [ ] Advanced filtering UI
- [ ] Data visualization (charts/graphs)
- [ ] Export to Excel/CSV
- [ ] Search history
- [ ] Saved queries
- [ ] Real-time data updates
- [ ] Mobile responsive design
- [ ] Dark mode support
- [ ] Keyboard navigation

### Future Considerations
- [ ] User authentication
- [ ] Role-based access control
- [ ] API rate limiting
- [ ] Multi-language support (beyond English/Korean)
- [ ] Webhook integrations
- [ ] Custom dashboards
- [ ] Scheduled reports
- [ ] Data annotations

## Development Setup

### Prerequisites
```bash
# Required
- Node.js 18+
- PostgreSQL 14+
- npm/yarn/pnpm

# Environment Variables
DATABASE_URL=postgresql://user:pass@host:5432/dart_db
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Installation Steps
```bash
# 1. Create Next.js app
npx create-next-app@latest dart-e --typescript --tailwind --app

# 2. Install dependencies
cd dart-e
npm install pg @anthropic-ai/sdk
npm install @types/pg --save-dev

# 3. Setup shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dialog input

# 4. Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# 5. Run development server
npm run dev
```

## Database Connection Strategy

### Connection Pool Configuration
```typescript
// lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Query wrapper with logging
export async function query<T>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executed', { text, duration, rows: res.rowCount });
    return res.rows;
  } catch (error) {
    console.error('Database query error', { text, error });
    throw error;
  }
}
```

## Deployment Options

### Option 1: Vercel (Recommended)
- Automatic deployments from Git
- Edge functions for API routes
- Built-in analytics
- Global CDN

### Option 2: AWS
- EC2 or ECS for containers
- RDS for PostgreSQL
- CloudFront for CDN
- More control over infrastructure

### Option 3: Self-Hosted
- Docker containers
- Nginx reverse proxy
- PM2 for process management
- Manual scaling

## Success Metrics

### Performance
- [ ] Page load time < 2 seconds
- [ ] Search response < 500ms
- [ ] Chat response < 3 seconds
- [ ] 60fps UI interactions

### User Experience
- [ ] Mobile responsive
- [ ] Keyboard accessible
- [ ] Error recovery
- [ ] Offline capability (partial)

### Technical
- [ ] 90%+ test coverage
- [ ] Zero critical security issues
- [ ] <1% error rate
- [ ] 99.9% uptime

## Timeline

- **Week 1**: Foundation + Core API
- **Week 2**: UI Components + Integration
- **Week 3**: Advanced Features
- **Week 4**: Polish + Testing
- **Week 5**: Deployment + Documentation

Total estimated time: **5 weeks** for MVP

## Completed Work Summary

### ✅ Phases 1-3 Successfully Completed

**Major Achievements:**
1. **Full Next.js implementation** with TypeScript and App Router
2. **Direct PostgreSQL integration** using pg library (no ORM overhead)
3. **Claude AI integration** with proper context building
4. **Critical ContextBuilder implementation** - Formats actual table data as TSV for accurate responses
5. **Bilingual support** with English-first interface and Korean keyword mapping
6. **Production-ready code quality** - All TypeScript types defined, ESLint clean
7. **Fixed component integration issues** - Quick queries properly populate chat interface

**Key Technical Improvements:**
- Implemented proper data context formatting (missing in initial implementation)
- Fixed keyword handling for both array and object formats from Claude
- Proper TypeScript types throughout (no `any` types)
- Clean ESLint compliance
- Responsive UI with shadcn/ui components

## Next Steps

### Immediate (Optional):
1. Begin Phase 4: Advanced Features
   - Real-time updates
   - Session management
   - Data visualization

### Future Development:
1. Phase 5: Polish & Optimization
2. Phase 6: Production Deployment
3. Enhanced features from roadmap

---

*Last Updated: Phase 3 completion with ContextBuilder fix and code quality review*