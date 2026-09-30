const pool = require('../db/pool');

// Helper to resolve a wallet by either UUID or sequential numeric ID (e.g. 1, 2, 3...)
async function resolveWallet(identifier) {
  if (!identifier) return null;
  const strId = String(identifier).trim();

  // Check if it is a valid UUID format
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(strId);
  if (isUuid) {
    const res = await pool.query(
      'SELECT id, wallet_number, balance, user_id FROM wallets WHERE id = $1',
      [strId]
    );
    return res.rows[0] || null;
  }

  // Check if it is a numeric ID (1, 2, 3...)
  const numId = parseInt(strId, 10);
  if (!isNaN(numId) && String(numId) === strId) {
    const res = await pool.query(
      'SELECT id, wallet_number, balance, user_id FROM wallets WHERE wallet_number = $1',
      [numId]
    );
    return res.rows[0] || null;
  }

  return null;
}

// Baseline Get Balance: Demonstrates IDOR (W1)
// Accepts either UUID or numeric Wallet ID (e.g. /api/wallets/1/balance or /api/wallets/<uuid>/balance)
async function getBalance(req, res) {
  const { walletId } = req.params;

  try {
    const wallet = await resolveWallet(walletId);

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found.' });
    }

    return res.status(200).json({
      walletId: wallet.id,
      walletNumber: wallet.wallet_number,
      balance: wallet.balance
    });
  } catch (error) {
    console.error('getBalance error:', error);
    return res.status(500).json({ error: 'Failed to retrieve wallet balance.' });
  }
}

// Baseline Transfer: Demonstrates IDOR (W1), Concurrency (W4), Missing Validation (W5)
// Sender & Receiver can be specified as either full UUID OR sequential numeric ID (1, 2, 3...)
async function transfer(req, res) {
  const { walletId: senderWalletIdentifier } = req.params;
  const { receiverWalletId, amount } = req.body;

  try {
    const senderWallet = await resolveWallet(senderWalletIdentifier);
    if (!senderWallet) {
      return res.status(404).json({ error: 'Sender wallet not found.' });
    }

    const receiverWallet = await resolveWallet(receiverWalletId);
    if (!receiverWallet) {
      return res.status(404).json({ error: 'Receiver wallet not found. Check UUID or Wallet Number.' });
    }

    // Step 1: Unlocked, unisolated update on sender balance
    await pool.query(
      'UPDATE wallets SET balance = balance - $1 WHERE id = $2',
      [amount, senderWallet.id]
    );

    // Step 2: Unlocked, unisolated update on receiver balance
    await pool.query(
      'UPDATE wallets SET balance = balance + $1 WHERE id = $2',
      [amount, receiverWallet.id]
    );

    // Step 3: Record transaction
    const txResult = await pool.query(
      `INSERT INTO transactions (sender_wallet_id, receiver_wallet_id, amount, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id, sender_wallet_id, receiver_wallet_id, amount, status, created_at`,
      [senderWallet.id, receiverWallet.id, amount, 'completed']
    );

    return res.status(200).json({
      message: 'Transfer completed successfully (Baseline - Insecure Mode)',
      transaction: {
        ...txResult.rows[0],
        sender_wallet_number: senderWallet.wallet_number,
        receiver_wallet_number: receiverWallet.wallet_number
      }
    });
  } catch (error) {
    console.error('Transfer error:', error);
    return res.status(500).json({ error: 'Transfer failed.', details: error.message });
  }
}

// Baseline Get Transactions: Demonstrates IDOR (W1)
// Accepts either UUID or numeric Wallet ID
async function getTransactions(req, res) {
  const { walletId } = req.params;

  try {
    const wallet = await resolveWallet(walletId);
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found.' });
    }

    const result = await pool.query(
      `SELECT t.id, t.sender_wallet_id, t.receiver_wallet_id, t.amount, t.status, t.created_at,
              sw.wallet_number AS sender_wallet_number,
              rw.wallet_number AS receiver_wallet_number
       FROM transactions t
       LEFT JOIN wallets sw ON t.sender_wallet_id = sw.id
       LEFT JOIN wallets rw ON t.receiver_wallet_id = rw.id
       WHERE t.sender_wallet_id = $1 OR t.receiver_wallet_id = $1
       ORDER BY t.created_at DESC`,
      [wallet.id]
    );

    return res.status(200).json({
      walletId: wallet.id,
      walletNumber: wallet.wallet_number,
      transactions: result.rows
    });
  } catch (error) {
    console.error('getTransactions error:', error);
    return res.status(500).json({ error: 'Failed to retrieve transactions.' });
  }
}

module.exports = {
  getBalance,
  transfer,
  getTransactions
};
