/**
 * Script pour créer un utilisateur de test via l'API publique
 *
 * Cette approche utilise l'API publique de Supabase pour créer un utilisateur
 */

const https = require('https');

const SUPABASE_URL = 'https://jcizfxniwgwfdmubapyb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzInR5cI1NiIsCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjaXpmeG5pd2d3ZmRtdWJhcHliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1Njk5MjgsImV4cCI6MjA4MjE0NTkyOH0.ZMReVdLgTRdV8MTWZ8yUBeknBuJAZZON_77OPoxp6-c';

const testEmail = 'test@codeswitch.app';
const testPassword = 'TestPassword123!@#';

async function signupUser() {
  console.log('📝 Inscription d\'un nouvel utilisateur via API publique...');
  console.log(`   Email: ${testEmail}`);

  const postData = JSON.stringify({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        created_by: 'test-script'
      }
    }
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

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(`   Status: ${res.statusCode}`);

      try {
        const response = JSON.parse(data);

        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ Utilisateur créé avec succès!');
          console.log(`   User ID: ${response.user?.id || 'N/A'}`);
          console.log('\n📝 Credentials pour les tests Playwright:');
          console.log(`   Email: ${testEmail}`);
          console.log(`   Password: ${testPassword}`);
          console.log('\n⚠️  Note: L\'utilisateur doit confirmer son email avant de pouvoir se connecter.');
          console.log('    Dans un environnement de test, vous pouvez ignorer cette étape via les paramètres Supabase.');
        } else if (response.error_description?.includes('already registered') ||
                   response.msg?.includes('already registered') ||
                   data.includes('already registered')) {
          console.log('⚠️  Utilisateur déjà enregistré!');
          console.log('\n📝 Credentials pour les tests Playwright:');
          console.log(`   Email: ${testEmail}`);
          console.log(`   Password: ${testPassword}`);
          console.log('\n🎉 Prêt pour les tests Playwright!');
        } else {
          console.error('❌ Erreur:', response.error_description || response.msg || data);
        }
      } catch (e) {
        console.error('❌ Erreur de parsing:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Erreur de requête:', error.message);
  });

  req.write(postData);
  req.end();
}

async function loginUser() {
  console.log('\n🔐 Tentative de connexion pour vérifier les credentials...');

  const postData = JSON.stringify({
    email: testEmail,
    password: testPassword
  });

  const options = {
    hostname: 'jcizfxniwgwfdmubapyb.supabase.co',
    path: '/auth/v1/token?grant_type=password',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(`   Status: ${res.statusCode}`);

      try {
        const response = JSON.parse(data);

        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ Connexion réussie!');
          console.log(`   Access Token: ${response.access_token?.substring(0, 20)}...`);
          console.log('\n🎉 Les credentials sont valides pour les tests Playwright!');
        } else if (response.error_description?.includes('Email not confirmed') ||
                   response.error?.includes('email_not_confirmed')) {
          console.log('⚠️  Email non confirmé!');
          console.log('    L\'utilisateur doit confirmer son email pour se connecter.');
          console.log('\n💡 Solution: Activer "Disable Email Confirmation" dans les paramètres Supabase');
          console.log('    pour les tests en environnement de développement.');
        } else {
          console.log('⚠️  Connexion échouée:', response.error_description || response.error || data);
        }
      } catch (e) {
        console.error('❌ Erreur de parsing:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Erreur de requête:', error.message);
  });

  req.write(postData);
  req.end();
}

async function main() {
  await signupUser();
  await loginUser();
}

main();
