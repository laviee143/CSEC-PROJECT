# Backend Scripts

Utility scripts for database setup and maintenance.

## 📋 Available Scripts

### `createAdmin.ts` - Admin User Creation

Creates an admin user account in the database for initial system setup.

**Usage:**

```bash
# From the backend directory
npx ts-node scripts/createAdmin.ts
```

**Prerequisites:**
- MongoDB Atlas connection configured in `.env`
- `MONGODB_URI` environment variable set
- ts-node installed (`npm install -D ts-node typescript`)

**Default Credentials:**
- Email: `admin@astu.edu.et`
- Password: `12345678`
- Role: `admin`
- University ID: `ugr/00000/00`

**⚠️ Important Notes:**
- Run this script only once during initial setup
- Change the default password after first login
- If admin already exists, the script will skip creation
- The password is automatically hashed using bcrypt

**Example Output:**

```
============================================================
  አሳሽ AI - Admin User Creation Tool
============================================================

🔌 Connecting to MongoDB Atlas...
✅ Connected successfully!

🔍 Checking if admin user already exists...
📝 Creating admin user...

✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅

  🎉 SUCCESS! Admin user created successfully!

  📧 Email:     admin@astu.edu.et
  🔑 Password:  12345678
  👤 Role:      admin
  🏫 University ID: ugr/00000/00

────────────────────────────────────────────────────────────
  ⚠️  IMPORTANT: Save these credentials securely!
  💡 TIP: Change the password after first login
────────────────────────────────────────────────────────────

🔌 Database connection closed.
```

---

### `find_duplicates.js` - Find Duplicate Documents

Finds and reports duplicate documents in the database.

**Usage:**

```bash
node scripts/find_duplicates.js
```

---

## 🔧 Development

### Adding New Scripts

1. Create a new `.ts` or `.js` file in this directory
2. Import required dependencies
3. Load environment variables with `dotenv.config()`
4. Add proper error handling and user feedback
5. Document the script in this README

### Best Practices

- ✅ Use TypeScript for type safety
- ✅ Add clear console output with emojis for better UX
- ✅ Handle errors gracefully with helpful messages
- ✅ Close database connections properly
- ✅ Make scripts idempotent (safe to run multiple times)
- ✅ Document usage and prerequisites

---

## 🆘 Troubleshooting

### "MONGODB_URI not set in .env"

**Solution:** Create a `.env` file in the `backend` folder with:
```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/asash-ai
JWT_SECRET=super_secret_key_123
```

### "Failed to connect to MongoDB"

**Check:**
1. IP address is whitelisted in MongoDB Atlas → Network Access
2. Database credentials are correct
3. Network connection is stable

### "Admin already exists"

This is normal if you've already run the script. Use the existing credentials to login.

---

**Need help?** Check the main project README or contact the development team.
