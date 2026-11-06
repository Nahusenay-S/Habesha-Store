const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'habesha-store-default-dev-secret-key';
  const expiresIn = process.env.JWT_EXPIRE || '7d';
  return jwt.sign({ id }, secret, { expiresIn });
};

const verifyToken = (token) => {
  try {
    const secret = process.env.JWT_SECRET || 'habesha-store-default-dev-secret-key';
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

module.exports = { generateToken, verifyToken };