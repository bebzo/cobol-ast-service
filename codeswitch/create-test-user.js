/**
 * Script pour créer un utilisateur de test dans Supabase
 *
 * Ce script crée un utilisateur test@codeswitch.app avec un mot de passe sécurisé
 * pour permettre aux tests Playwright de se connecter normalement.
 */

const { createClient } = require('@supabase/supabase-js');

// Utiliser les variables d'environnement directement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jcizfxniwgwfdmubapyb.supabase.co';
const supabaseKey = process.env.SUPABASE_ACCESS_TOKEN;

async function createTestUser() {
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables Supabase manquantes');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl || '❌ Manquant');
    console.log('SUPABASE_ACCESS_TOKEN:', supabaseKey ? '✅ Configuré' : '❌ Manquant');
    process.exit(1);
  }

  console.log('🔧 Initialisation du client Supabase Admin...');
  console.log(`   URL: ${supabaseUrl}`);

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const testEmail = 'test@codeswitch.app';
  const testPassword = 'TestPassword123!@#';

  console.log('👤 Création de l\'utilisateur de test...');
  console.log(`   Email: ${testEmail}`);
  console.log(`   Password: ${testPassword}`);

  try {
    // Essayer de créer l'utilisateur via l'API admin
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
      // Si l'utilisateur existe déjà
      if (error.message.includes('User already registered') || error.message.includes('already exists')) {
        console.log('⚠️  Utilisateur existe déjà - mise à jour du mot de passe...');

        // Lister les utilisateurs pour trouver l'ID
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users?.users?.find(u => u.email === testEmail);

        if (existingUser) {
          // Mettre à jour le mot de passe
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password: testPassword }
          );

          if (updateError) {
            console.error('❌ Erreur lors de la mise à jour du mot de passe:', updateError.message);
            process.exit(1);
          }

          console.log('✅ Mot de passe mis à jour avec succès!');
          console.log('\n📝 Credentials pour les tests Playwright:');
          console.log(`   Email: ${testEmail}`);
          console.log(`   Password: ${testPassword}`);
        }
      } else {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
      }
    } else {
      console.log('✅ Utilisateur créé avec succès!');
      console.log(`   User ID: ${user.user.id}`);
      console.log('\n📝 Credentials pour les tests Playwright:');
      console.log(`   Email: ${testEmail}`);
      console.log(`   Password: ${testPassword}`);
    }

    console.log('\n🎉 Opération terminée avec succès!');

  } catch (err) {
    console.error('❌ Erreur critique:', err);
    process.exit(1);
  }
}

createTestUser();
