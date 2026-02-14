import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

const printBanner = () => {
  console.log('\n' + '='.repeat(60));
  console.log('  አሳሽ AI - Admin User Creation Tool');
  console.log('='.repeat(60) + '\n');
};

const printSuccess = (email: string, password: string) => {
  console.log('\n' + '✅'.repeat(30));
  console.log('\n  🎉 SUCCESS! Admin user created successfully!\n');
  console.log('  📧 Email:    ', email);
  console.log('  🔑 Password: ', password);
  console.log('  👤 Role:     ', 'admin');
  console.log('  🏫 University ID: ugr/00000/00');
  console.log('\n' + '─'.repeat(60));
  console.log('  ⚠️  IMPORTANT: Save these credentials securely!');
  console.log('  💡 TIP: Change the password after first login');
  console.log('─'.repeat(60) + '\n');
};

async function createAdmin() {
  printBanner();

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ Error: MONGODB_URI not set in .env file');
    console.log('\n💡 Solution:');
    console.log('   1. Create a .env file in the backend folder');
    console.log('   2. Add: MONGODB_URI=mongodb+srv://...');
    console.log('   3. Run this script again\n');
    process.exit(1);
  }

  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(uri);
    console.log('✅ Connected successfully!\n');

    const email = 'admin@astu.edu.et';
    const password = '12345678';

    console.log('🔍 Checking if admin user already exists...');
    const exists = await User.findOne({ email });
    
    if (exists) {
      console.log('ℹ️  Admin user already exists:', email);
      console.log('\n💡 You can use these credentials to login:');
      console.log('   Email:    ', email);
      console.log('   Password: ', password);
      console.log('\n⚠️  If you forgot the password, delete the user from MongoDB');
      console.log('   and run this script again.\n');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log('📝 Creating admin user...');
    
    // Create admin user. Password will be hashed by the User model pre-save hook.
    await User.create({
      name: 'Admin User',
      email,
      universityId: 'ugr/00000/00',
      password,
      role: 'admin',
      isActive: true
    });

    printSuccess(email, password);

    await mongoose.connection.close();
    console.log('🔌 Database connection closed.\n');
    process.exit(0);
    
  } catch (err: any) {
    console.error('\n❌ Error creating admin user:\n');
    
    if (err.code === 11000) {
      console.error('   Duplicate key error - admin user already exists');
      console.log('   Run: db.users.deleteOne({ email: "admin@astu.edu.et" })');
    } else if (err.name === 'ValidationError') {
      console.error('   Validation failed:', err.message);
    } else if (err.name === 'MongooseError' || err.name === 'MongoError') {
      console.error('   Database error:', err.message);
      console.log('\n💡 Check:');
      console.log('   1. MONGODB_URI is correct');
      console.log('   2. IP address is whitelisted in MongoDB Atlas');
      console.log('   3. Database user has write permissions');
    } else {
      console.error('   ', err.message || err);
    }
    
    console.log('\n');
    process.exit(1);
  }
}

createAdmin();
