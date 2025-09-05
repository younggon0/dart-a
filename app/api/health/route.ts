import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      api: true,
      database: false,
    }
  };

  // Check database connection
  try {
    await pool.query('SELECT 1');
    health.checks.database = true;
  } catch (error) {
    health.status = 'degraded';
    console.error('Database health check failed:', error);
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  
  return NextResponse.json(health, { status: statusCode });
}