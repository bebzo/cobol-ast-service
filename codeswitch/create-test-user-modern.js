/**
 * Script pour créer un utilisateur de test dans Supabase
 * Utilise le nouveau format de clé API (sb_secret_xxx)
 */

const { createClient } = require('@supabase/supabase-js');

// Nouvelle clé API au format moderne
const SERVICE_ROLE_KEY = 'sb_secret_shFxZneKeDr497TLAbmn3Q_83Lw7zgZ';
const SUPABASE_URL = 'https://jcizfxniwgwfdmubapyb.supabase.co';

async function createTestUser() {
  console.log('🔧 Initialisation du client Supabase Admin...');
  console.log(`   URL: ${SUPABASE_URL}`);
  console.log(`   Key: ${SERVICE_ROLE_KEY.substring(0, 20)}...`);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const testEmail = 'test@codeswitch.app';
  const testPassword = 'TestPassword123!@#';

  console.log('\n👤 Création de l\'utilisateur de test...');
  console.log(`   Email: ${testEmail}`);
  console.log(`   Password: ${testPassword}`);

  try {
    // Essayer de créer l'utilisateur via l'API admin
    console.log('\n⏳ Tentative de création...');
    const { data: user, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirmed: true,
      user_metadata: {
        created_by: 'test-script',
        purpose: 'playwright-testing'
      }
    });

    if (error) {
      console.log(`❌ Erreur: ${error.message}`);

      // Si l'utilisateur existe déjà
      if (error.message.includes('User already registered') || error.message.includes('already exists')) {
        console.log('\n⚠️  Utilisateur existe déjà!');

        // Lister les utilisateurs pour trouver l'ID
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users?.users?.find(u => u.email === testEmail);

        if (existingUser) {
          console.log(`   User ID: ${existingUser.id}`);

          // Mettre à jour le mot de passe
          console.log('\n🔄 Mise à jour du mot de passe...');
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password: testPassword }
          );

          if (updateError) {
            console.error('❌ Erreur lors de la mise à jour:', updateError.message);
            process.exit(1);
          }

          console.log('✅ Mot de passe mis à jour!');
        }
      } else {
        // Autres erreurs
        console.log('\n💡 Conseil: Vérifiez que les paramètres suivants sont corrects:');
        console.log('   - "Confirm email" désactivé dans Settings > Auth > Email');
        console.log('   - La clé API a les droits admin');
      }
    } else {
      console.log('\n✅ Utilisateur créé avec succès!');
      console.log(`   User ID: ${user.user.id}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📝 CREDENTIALS POUR LES TESTS PLAYWRIGHT:');
    console.log('='.repeat(60));
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log('='.repeat(60));
    console.log('\n🎉 Prêt pour les tests!');

  } catch (err) {
    console.error('\n❌ Erreur critique:', err.message || err);
    console.log('\n💡 Suggestions:');
    console.log('   - Vérifiez la connexion internet');
    console.log('   - Vérifiez que l\'URL Supabase est correcte');
    process.exit(1);
  }
}

createTestUser();
