const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const JWT_SECRET = process.env.JWT_SECRET || 'ewaste_secure_jwt_secret_2024';

exports.register = async (req, res) => {
  const { name, email, phone, address, password, role, location, skill } = req.body;
  if (!name || !email || !password || !role)
    return res.status(400).json({ error: 'Name, email, password, and role are required.' });
  if (!['user', 'worker', 'admin'].includes(role))
    return res.status(400).json({ error: 'Invalid role.' });

  const password_hash = bcrypt.hashSync(password, 10);
  try {
    if (role === 'worker') {
      const result = await db.runAsync(
        'INSERT INTO workers (name, email, phone, location, skill, password_hash) VALUES (?,?,?,?,?,?)',
        [name, email, phone || '', location || '', skill || 'General Collection', password_hash]
      );
      const token = jwt.sign({ id: result.lastID, role: 'worker' }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({ token, user: { id: result.lastID, name, email, role: 'worker' } });
    } else {
      const result = await db.runAsync(
        'INSERT INTO users (name, email, phone, address, password_hash, role) VALUES (?,?,?,?,?,?)',
        [name, email, phone || '', address || '', password_hash, role]
      );
      const token = jwt.sign({ id: result.lastID, role }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({ token, user: { id: result.lastID, name, email, role } });
    }
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed'))
      return res.status(409).json({ error: 'Email already registered.' });
    return res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role)
    return res.status(400).json({ error: 'Email, password, and role are required.' });
  try {
    let user;
    if (role === 'worker') {
      user = await db.getAsync('SELECT * FROM workers WHERE email = ?', [email]);
      if (user) user.role = 'worker';
    } else {
      user = await db.getAsync('SELECT * FROM users WHERE email = ? AND role = ?', [email, role]);
    }
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
    if (!bcrypt.compareSync(password, user.password_hash))
      return res.status(401).json({ error: 'Invalid credentials.' });
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
