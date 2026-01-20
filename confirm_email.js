const SUPABASE_URL = 'https://jcizfxniwgwfdmubapyb.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjaXpmeG5pd2d3ZmRtdWJhcHliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU2OTkyOCwiZXhwIjoyMDgyMTQ1OTI4fQ.HZykwqxvcQuwYqbWudpi7LUceko44YqSirRvzYs85TU';

async function confirmUserEmail() {
  console.log('=== Supabase Admin: Confirm User Email ===\n');
  
  const email = 'embebengon@gmail.com';

  try {
    console.log(`1. Looking up user: ${email}`);
    
    // Use admin API to list users
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      }
    });
    
    if (!response.ok) {
      console.log('   Error:', await response.text());
      return;
    }
    
    const data = await response.json();
    console.log('   Response type:', typeof data);
    console.log('   Has users property:', 'users' in data);
    
    const allUsers = data.users || data;
    console.log(`   Found ${Array.isArray(allUsers) ? allUsers.length : 'unknown'} users`);
    
    const targetUser = Array.isArray(allUsers) 
      ? allUsers.find(u => u.email === email)
      : null;
    
    if (targetUser) {
      console.log(`\n   ✓ Found user:`);
      console.log(`     ID: ${targetUser.id}`);
      console.log(`     Email: ${targetUser.email}`);
      console.log(`     Email confirmed: ${targetUser.email_confirmed_at ? 'Yes' : 'No'}`);
      
      // Now update the user to confirm email
      console.log(`\n2. Confirming email...`);
      
      const updateResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${targetUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'apikey': SERVICE_ROLE_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email_confirm: true
        })
      });
      
      if (updateResponse.ok) {
        const result = await updateResponse.json();
        console.log('   ✓ SUCCESS: Email confirmed!');
        console.log('   Result:', JSON.stringify(result, null, 2).substring(0, 200));
        console.log('\n=== NEXT STEP ===');
        console.log('Try logging in at: http://localhost:3000/login');
        console.log('Email: embebengon@gmail.com');
        console.log('Password: EManu1231975@@');
      } else {
        console.log('   ✗ Failed to confirm email');
        console.log('   Error:', await updateResponse.text());
      }
    } else {
      console.log('\n   ✗ User not found in Supabase');
      console.log('   This could mean:');
      console.log('   - User was not actually created');
      console.log('   - Wrong email address');
      console.log('   - Need to sign up first');
      
      console.log('\n=== TRYING SIGN UP ===');
      console.log('Creating user via admin API...');
      
      const createResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'apikey': SERVICE_ROLE_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: 'EManu1231975@@',
          email_confirm: true
        })
      });
      
      if (createResponse.ok) {
        const newUser = await createResponse.json();
        console.log('   ✓ User created and confirmed!');
        console.log('   User ID:', newUser.id);
        console.log('\n=== USER READY ===');
        console.log('You can now log in at: http://localhost:3000/login');
        console.log('Email: embebengon@gmail.com');
        console.log('Password: EManu1231975@@');
      } else {
        console.log('   Error creating user:', await createResponse.text());
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

confirmUserEmail();
