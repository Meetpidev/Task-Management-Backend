const User = require('../models/User');

const ensureAdminUser = async () => {
  const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const name = process.env.ADMIN_NAME || 'Admin';

  const existing = await User.findOne({ email }).select('+password');
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
    }
    return existing;
  }

  return User.create({
    name,
    email,
    password,
    role: 'admin',
  });
};

module.exports = ensureAdminUser;
