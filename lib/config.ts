export const config = {
  database: {
    url: process.env.DATABASE_URL!,
    maxConnections: 20,
    idleTimeout: 30000,
    connectionTimeout: 2000,
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY!,
  },
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'DART-E Intelligence Platform',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  defaults: {
    maxSearchResults: 5,
    defaultCompany: {
      name: 'Samsung Electronics',
      code: '00126380',
    },
  },
};

export type Config = typeof config;