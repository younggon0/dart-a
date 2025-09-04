// Simple API test script
const baseURL = 'http://localhost:3000/api';

async function testAPIs() {
  console.log('Testing DART-E APIs...\n');
  
  // Test companies endpoint
  console.log('1. Testing /api/companies');
  try {
    const res = await fetch(`${baseURL}/companies`);
    const data = await res.json();
    console.log('✅ Companies:', data.success ? `Found ${data.count} companies` : '❌ Failed');
    if (data.data) console.log('   -', data.data[0]?.name);
  } catch (error) {
    console.log('❌ Companies API failed:', error.message);
  }
  
  // Test search endpoint (GET)
  console.log('\n2. Testing /api/search (GET)');
  try {
    const res = await fetch(`${baseURL}/search?limit=2`);
    const data = await res.json();
    console.log('✅ Search GET:', data.success ? `Found ${data.count} results` : '❌ Failed');
  } catch (error) {
    console.log('❌ Search API failed:', error.message);
  }
  
  // Test search endpoint (POST)
  console.log('\n3. Testing /api/search (POST)');
  try {
    const res = await fetch(`${baseURL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        corpCode: '00126380',
        keywords: ['revenue', 'sales'],
        limit: 3
      })
    });
    const data = await res.json();
    console.log('✅ Search POST:', data.success ? `Found ${data.count} results` : '❌ Failed');
  } catch (error) {
    console.log('❌ Search API failed:', error.message);
  }
  
  // Test chat endpoint
  console.log('\n4. Testing /api/chat');
  try {
    const res = await fetch(`${baseURL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What is the latest revenue?',
        language: 'en'
      })
    });
    const data = await res.json();
    console.log('✅ Chat:', data.success ? 'Generated response' : '❌ Failed');
    if (data.analysis) console.log('   Analysis:', data.analysis.intent);
  } catch (error) {
    console.log('❌ Chat API failed:', error.message);
  }
  
  console.log('\n✨ API tests complete!');
}

testAPIs();