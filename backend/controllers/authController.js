const { query } = require('../db');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const register = async (req, res) => {
  try {
    const { name, email, password, role = 'buyer' } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = await query('SELECT id FROM users WHERE email = LOWER($1)', [email]);
    if (existing.rowCount) return res.status(400).json({ error: 'User already exists' });

    const result = await query(
      `INSERT INTO users (name, email, password, role) VALUES ($1, LOWER($2), $3, $4)
       RETURNING id, name, email, role`,
      [name.trim(), email, await hashPassword(password), role === 'seller' ? 'seller' : 'buyer']
    );
    const user = result.rows[0];
    return res.status(201).json({ message: 'User registered successfully', token: generateToken(user.id), user: publicUser(user) });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Unable to register user' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    const result = await query('SELECT id, name, email, role, password FROM users WHERE email = LOWER($1) AND is_active = TRUE', [email]);
    const user = result.rows[0];
    if (!user || !(await comparePassword(password, user.password))) return res.status(401).json({ error: 'Invalid credentials' });
    return res.json({ message: 'Login successful', token: generateToken(user.id), user: publicUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Unable to log in' });
  }
};

const getProfile = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, email, phone, address, role, is_active AS "isActive", profile_image AS "profileImage", created_at AS "createdAt"
       FROM users WHERE id = $1`,
      [req.userId]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'User not found' });
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(503).json({ error: 'Profile service is temporarily unavailable' });
  }
};

const updateProfile = async (req, res) => {
  const { name, phone, address } = req.body;
  const result = await query(
    `UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone),
     address = COALESCE($3::jsonb, address), updated_at = NOW()
     WHERE id = $4 RETURNING id, name, email, phone, address, role`,
    [name, phone, address ? JSON.stringify(address) : null, req.userId]
  );
  if (!result.rowCount) return res.status(404).json({ error: 'User not found' });
  return res.json({ message: 'Profile updated successfully', user: result.rows[0] });
};

module.exports = { register, login, getProfile, updateProfile };
