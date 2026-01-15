const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jcizfxniwgwfdmubapyb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjaXpmeG5pd2d3ZmRtdWJhcHliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1Njk5MjgsImV4cCI6MjA4MjE0NTkyOH0.ZMReVdLgTRdV8MTWZ8yUBeknBuJAZZON_77OPoxp6-c';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  // Essayer avec différents formats d'email
  const emails = [
    'admin@test.com',
    'codeswitch.admin@outlook.com',
    'admin_test@proton.me'
  ];
  
  for (const email of emails) {
    console.log(`\nTest avec: ${email}`);
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: 'SecurePass2026!'
    });
    
    if (error) {
      console.log('  Erreur:', error.message);
    } else {
      console.log('  Succès! User ID:', data.user?.id);
      console.log('  Email confirmé:', data.user?.email_confirmed_at ? 'Oui' : 'Non');
      console.log('  Session:', data.session ? 'Active' : 'Attente confirmation');
      break;
    }
  }
}

testAuth();
