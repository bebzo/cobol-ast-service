/**
 * Création d'un utilisateur CodeSwitch avec email @minimax.io
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jcizfxniwgwfdmubapyb.supabase.co';
const SERVICE_ROLE_KEY = 'sb_secret_shFxZneKeDr497TLAbmn3Q_83Lw7zgZ';

async function createMinimaxUser() {
  console.log('🚀 Création utilisateur @minimax.io...\n');

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const email = 'dev@minimax.io';
  const password = 'CodeSwitch2024!';

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Confirmer l'email directement
      user_metadata: {
        full_name: 'MiniMax Developer',
        role: 'developer'
      }
    });

    if (error) {
      console.error('❌ Erreur:', error.message);
      return null;
    }

    console.log('✅ Utilisateur créé avec succès!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Mot de passe: ${password}`);
    console.log(`🆔 ID: ${data.user.id}`);

    return data.user;
  } catch (err) {
    console.error('💥 Erreur critique:', err.message);
    return null;
  }
}

createMinimaxUser()
  .then(user => {
    if (user) {
      console.log('\n📋 Coordonnées pour le test:');
      console.log(`   Email: dev@minimax.io`);
      console.log(`   Mot de passe: ${'CodeSwitch2024!'}`);
    }
    process.exit(user ? 0 : 1);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
