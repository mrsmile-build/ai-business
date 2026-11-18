async function test() {
  console.log('Testing login...');
  const loginRes = await fetch('https://www.ai-business.com.ng/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'YOUR_EMAIL', password: 'YOUR_PASSWORD' })
  });
  
  console.log('Status:', loginRes.status);
  const text = await loginRes.text();
  console.log('Response (first 200 chars):', text.substring(0, 200));
  
  if (!loginRes.ok || text.includes('<!DOCTYPE')) {
    console.log('\nLogin failed - check endpoint and credentials');
    return;
  }
  
  const loginData = JSON.parse(text);
  const token = loginData.token || loginData.accessToken;
  if (!token) { console.error('No token in response'); return; }
  console.log('\n✓ Logged in, searching...');

  const searchRes = await fetch('https://www.ai-business.com.ng/api/lead-finder', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({
      industry: 'tailor',
      service: 'tailor',
      location: 'Surulere Lagos'
    })
  });
  
  const searchText = await searchRes.text();
  console.log('Search status:', searchRes.status);
  if (searchText.includes('<!DOCTYPE')) {
    console.log('Search returned HTML, not JSON');
    return;
  }
  
  const data = JSON.parse(searchText);
  if (data.success && data.leads && data.leads.length) {
    console.log(`\n✓ Found ${data.leads.length} leads. First 2:`);
    console.log(JSON.stringify(data.leads.slice(0, 2), null, 2));
  } else {
    console.log('No leads or error:', data);
  }
}

test().catch(e => console.error('Error:', e.message));
