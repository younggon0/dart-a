import { testConnection } from './db';

async function test() {
  const connected = await testConnection();
  console.log('Database connection:', connected ? '✅ Success' : '❌ Failed');
  process.exit(connected ? 0 : 1);
}

test();