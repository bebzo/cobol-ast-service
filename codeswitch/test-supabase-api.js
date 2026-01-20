const https = require('https');

const SUPABASE_URL = 'https://jcizfxniwgwfdmubapyb.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Clé API:', SUPABASE_ANON_KEY ? '✅ Présente (' + SUPABASE_ANON_KEY.length + ' chars)' : '❌ Manquante');

const postData = JSON.stringify({
  email: 'test@codeswitch.app',
  password: 'TestPassword123!@#'
});

const options = {
  hostname: 'jcizfxniwgwfdmubapyb.supabase.co',
  path: '/auth/v1/signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', e => console.error('Error:', e.message));
req.write(postData);
req.end();
