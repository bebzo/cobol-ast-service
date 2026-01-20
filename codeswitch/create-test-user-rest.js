/**
 * Script pour créer un utilisateur de test via l'API REST Supabase
 * Utilise directement l'API REST au lieu du SDK
 */

const https = require('https');

const SUPABASE_URL = 'https://jcizfxniwgwfdmubapyb.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjaXpmeG5pd2d3ZmRtdWJhcHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU2OTkyOCwiZXhwIjoxODQxMTE1OTI4fQ.HZykwqxvcQuwYqbWudpi7LUceko44YqSirRvzYs85TU';

console.log('🔧 Test de connexion à Supabase...');
console.log(`   URL: ${SUPABASE_URL}`);
console.log(`   Key: ${SERVICE_ROLE_KEY.substring(0, 50)}...`);

// Test 1: Lister les utilisateurs (avec service role)
console.log('\n📋 Test 1: Liste des utilisateurs...');

const listOptions = {
  hostname: 'jcizfxniwgwfdmubapyb.supabase.co',
  path: '/auth/v1/admin/users',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'apikey': SERVICE_ROLE_KEY
  }
};

const listReq = https.request(listOptions, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', async () => {
    console.log(`   Status: ${res.statusCode}`);
    console.log(`   Response: ${data.substring(0, 200)}...`);

    if (res.statusCode === 200) {
      console.log('✅ Service Role Key fonctionne!');

      // Test 2: Créer un utilisateur
      await createUser();
    } else {
      console.log('❌ Service Role Key non valide');
      console.log('\n💡 Suggestions:');
      console.log('   - Vérifiez que la clé est correcte');
      console.log('   - Assurez-vous que la clé n\'a pas expiré');
      console.log('   - La clé doit commencer par "service_role" ou "sbp_"');
    }
  });
});

listReq.on('error', (error) => {
  console.error('❌ Erreur de connexion:', error.message);
});

listReq.end();

// Fonction pour créer un utilisateur
async function createUser() {
  console.log('\n👤 Test 2: Création de l\'utilisateur test...');

  const testEmail = 'test@codeswitch.app';
  const testPassword = 'TestPassword123!@#';

  const postData = JSON.stringify({
    email: testEmail,
    password: testPassword,
    email_confirmed: true,
    user_metadata: {
      created_by: 'test-script',
      purpose: 'playwright-testing'
    }
  });

  const createOptions = {
    hostname: 'jcizfxniwgwfdmubapyb.supabase.co',
    path: '/auth/v1/admin/users',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const createReq = https.request(createOptions, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Response: ${data}`);

      if (res.statusCode === 200 || res.statusCode === 201) {
        try {
          const user = JSON.parse(data);
          console.log('\n✅ Utilisateur créé avec succès!');
          console.log(`   Email: ${testEmail}`);
          console.log(`   Password: ${testPassword}`);
          console.log(`   User ID: ${user.id}`);
          console.log('\n🎉 Prêt pour les tests Playwright!');
        } catch (e) {
          console.error('❌ Erreur de parsing:', e.message);
        }
      } else if (data.includes('User already registered') || data.includes('already exists')) {
        console.log('\n⚠️  Utilisateur déjà existant');
        console.log(`   Email: ${testEmail}`);
        console.log('\n🎉 Prêt pour les tests Playwright!');
      } else {
        console.log('\n❌ Erreur lors de la création');
      }
    });
  });

  createReq.on('error', (error) => {
    console.error('❌ Erreur de connexion:', error.message);
  });

  createReq.write(postData);
  createReq.end();
}
