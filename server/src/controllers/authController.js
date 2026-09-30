const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

// Baseline Register: Plaintext password (W2)
async function register(req, res) {
  const { username, email, password, initialBalance } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required.' });
  }

  try {
    const userInsertResult = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
      [username, email, password]
    );
    const user = userInsertResult.rows[0];

    const balance = (initialBalance !== undefined && initialBalance !== null) ? Number(initialBalance) : 0.00;
    const walletInsertResult = await pool.query(
      'INSERT INTO wallets (user_id, balance) VALUES ($1, $2) RETURNING id, wallet_number, balance, created_at',
      [user.id, balance]
    );
    const wallet = walletInsertResult.rows[0];

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at
      },
      wallet: {
        id: wallet.id,
        walletNumber: wallet.wallet_number,
        balance: wallet.balance
      }
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Username or email already exists.' });
    }
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
}

// Baseline Login: Raw string concatenation (W3)
async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const rawQuery = `SELECT * FROM users WHERE username = '${username}' AND password_hash = '${password}'`;
    console.log('[DEBUG - Vulnerable Query]:', rawQuery);

    const result = await pool.query(rawQuery);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user = result.rows[0];

    const walletResult = await pool.query(
      `SELECT id, wallet_number, balance FROM wallets WHERE user_id = '${user.id}'`
    );
    const wallet = walletResult.rows[0] || null;

    const secret = process.env.JWT_SECRET || 'supersecretjwtkey_change_in_production_12345!';
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      secret,
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      wallet: wallet ? {
        id: wallet.id,
        walletNumber: wallet.wallet_number,
        balance: wallet.balance
      } : null
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login.', details: error.message });
  }
}

async function logout(req, res) {
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
}

module.exports = {
  register,
  login,
  logout
};
