// Quick admin creation using in-memory MongoDB
// Run this after starting the backend server with npm run dev

const fetch = require('node-fetch');

const BACKEND_URL = 'http://localhost:5000';

async function createAdminLocal() {
  console.log('\n' + '='.repeat(60));
  console.log('  አሳሽ AI - Quick Admin Creation (In-Memory DB)');
  console.log('='.repeat(60) + '\n');

  try {
    console.log('🔍 Checking backend server...');
    
    // Check if server is running
    const statusRes = await fetch(`${BACKEND_URL}/api/status`);
    if (!statusRes.ok) {
      throw new Error('Backend server not running');
    }
    console.log('✅ Backend server is running!\n');

    // Try to signup as admin (will create user)
    console.log('📝 Creating admin account via signup...');
    
    const signupRes = await fetch(`${BACKEND_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Admin User',
        email: 'admin@astu.edu.et',
        universityId: 'ugr/00000/00',
        password: '12345678'
      })
    });

    const signupData = await signupRes.json();

    if (!signupRes.ok) {
      if (signupData.message && signupData.message.includes('already exists')) {
        console.log('ℹ️  Admin user already exists!\n');
        
        // Try to login to verify
        console.log('🔐 Testing login...');
        const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'admin@astu.edu.et',
            password: '12345678'
          })
        });

        const loginData = await loginRes.json();
        
        if (loginRes.ok && loginData.data && loginData.data.token) {
          console.log('✅ Login successful!\n');
          console.log('✅'.repeat(30));
          console.log('\n  🎉 Admin user is ready to use!\n');
          console.log('  📧 Email:     admin@astu.edu.et');
          console.log('  🔑 Password:  12345678');
          console.log('  👤 Role:      ' + (loginData.data.user.role || 'student'));
          console.log('  🎫 Token:     ' + loginData.data.token.substring(0, 50) + '...');
          console.log('\n' + '─'.repeat(60));
          console.log('  💡 You can now login to the frontend!');
          console.log('─'.repeat(60) + '\n');
        } else {
          console.log('❌ Login failed:', loginData.message);
          console.log('   The user exists but password might be different\n');
        }
      } else {
        throw new Error(signupData.message || 'Signup failed');
      }
    } else {
      // Signup successful
      console.log('✅ Admin user created!\n');
      console.log('✅'.repeat(30));
      console.log('\n  🎉 SUCCESS! Admin account created!\n');
      console.log('  📧 Email:     admin@astu.edu.et');
      console.log('  🔑 Password:  12345678');
      console.log('  👤 Role:      ' + (signupData.data.user.role || 'student'));
      console.log('  🎫 Token:     ' + signupData.data.token.substring(0, 50) + '...');
      console.log('\n' + '─'.repeat(60));
      console.log('  ⚠️  NOTE: Using in-memory database');
      console.log('  📝 Data will be lost on server restart');
      console.log('  💡 To persist data, fix MongoDB Atlas connection');
      console.log('─'.repeat(60) + '\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. Backend server is running (npm run dev)');
    console.log('   2. Server is accessible at http://localhost:5000');
    console.log('   3. Server has fallen back to in-memory MongoDB\n');
  }
}

createAdminLocal();
