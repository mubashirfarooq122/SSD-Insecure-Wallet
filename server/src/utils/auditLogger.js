const pool = require('../db/pool');

/**
 * logAudit: Security audit logging helper (Fix for W6)
 * Records forensic events directly into the database audit_logs table.
 *
 * @param {Object} event
 * @param {string|null} event.actorUserId - UUID of the authenticated actor (or null)
 * @param {string} event.action - Event type (LOGIN_SUCCESS, LOGIN_FAIL, TRANSFER, TRANSFER_DENIED, UNAUTHORIZED_ACCESS)
 * @param {string|null} event.target - Identifier of target resource (username, walletId, etc.)
 * @param {string} event.result - Result status ('SUCCESS', 'FAILURE', 'DENIED')
 * @param {string|null} event.ipAddress - Client IP address
 * @param {Object} [event.details={}] - Structured context metadata
 */
async function logAudit({ actorUserId, action, target, result, ipAddress, details }) {
  try {
    const query = `
      INSERT INTO audit_logs (actor_user_id, action, target, result, ip_address, details)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    const values = [
      actorUserId || null,
      action,
      target ? String(target) : null,
      result,
      ipAddress ? String(ipAddress).substring(0, 45) : null,
      details ? JSON.stringify(details) : '{}'
    ];
    await pool.query(query, values);
  } catch (error) {
    // Non-blocking catch to prevent logging failure from breaking primary application flow
    console.error('[AUDIT LOGGING FAILURE]:', error.message);
  }
}

module.exports = { logAudit };
