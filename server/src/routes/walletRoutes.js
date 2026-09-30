const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getBalance, transfer, getTransactions } = require('../controllers/walletController');

router.use(authenticateToken);

router.get('/:walletId/balance', getBalance);
router.post('/:walletId/transfer', transfer);
router.get('/:walletId/transactions', getTransactions);

module.exports = router;
