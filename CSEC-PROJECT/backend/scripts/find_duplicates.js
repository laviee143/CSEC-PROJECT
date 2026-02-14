// Simple utility to find (and optionally delete) users by universityId
// Usage:
//   node backend/scripts/find_duplicates.js --universityId "ugr/207874/15"
//   node backend/scripts/find_duplicates.js --universityId "ugr/207874/15" --delete --keepId <id-to-keep>

const mongoose = require('mongoose');

// Simple argv parsing (avoid external deps)
const rawArgs = process.argv.slice(2);
const argv = {};
for (let i = 0; i < rawArgs.length; i++) {
  const a = rawArgs[i];
  if (a.startsWith('--')) {
    const key = a.slice(2);
    const val = rawArgs[i + 1] && !rawArgs[i + 1].startsWith('--') ? rawArgs[++i] : true;
    argv[key] = val;
  }
}
const universityId = argv.universityId || argv.u;
const doDelete = !!argv.delete;
const keepId = argv.keepId || argv.keep || null;

if (!universityId) {
  console.error('Please provide --universityId "ugr/12345/16"');
  process.exit(2);
}

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/test';

async function main() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to', MONGO_URI);

  const userSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
  const User = mongoose.model('User_for_find', userSchema);

  const docs = await User.find({ universityId }).lean();
  console.log(`Found ${docs.length} user(s) with universityId="${universityId}"`);
  if (docs.length === 0) {
    await mongoose.disconnect();
    process.exit(0);
  }

  docs.forEach(d => {
    console.log('---');
    console.log('id:', d._id);
    console.log('name:', d.name);
    console.log('email:', d.email);
    console.log('role:', d.role);
    console.log('createdAt:', d.createdAt);
  });

  if (doDelete) {
    console.log('\n--delete flag set. Deleting duplicates...');
    const ids = docs.map(d => String(d._id));
    const toDelete = keepId ? ids.filter(id => id !== String(keepId)) : ids.slice(1); // keep first if not specified

    if (toDelete.length === 0) {
      console.log('Nothing to delete (keepId prevented deletion).');
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log('Deleting ids:', toDelete);
    const res = await User.deleteMany({ _id: { $in: toDelete } });
    console.log('deleteMany result:', res);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
