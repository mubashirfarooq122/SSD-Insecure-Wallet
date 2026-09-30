// ====================================================
// Mini Secure Fintech Wallet - Core Frontend Logic
// ====================================================

const API_BASE = (window.location.port === '4000' || window.location.port === '')
  ? `${window.location.origin}/api`
  : 'http://localhost:4000/api';

// ----------------------------------------------------
// THEME MANAGEMENT (Dark / Light Mode)
// ----------------------------------------------------
function initTheme() {
  const savedTheme = localStorage.getItem('wallet_theme') || 'dark';
  applyTheme(savedTheme);

  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
    });
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('wallet_theme', theme);
  updateThemeIcons(theme);
}

function updateThemeIcons(theme) {
  const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" /></svg>`;
  const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" /></svg>`;

  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
    btn.setAttribute('title', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
  });
}

// ----------------------------------------------------
// UI UTILITIES
// ----------------------------------------------------
function showAlert(message, type = 'error') {
  const alertBox = document.getElementById('alert-box');
  if (!alertBox) return;
  alertBox.className = `alert alert-${type} visible`;
  alertBox.innerHTML = `
    <svg style="width: 18px; height: 18px; flex-shrink: 0;" viewBox="0 0 20 20" fill="currentColor">
      ${type === 'success'
        ? '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />'
        : '<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />'}
    </svg>
    <span>${escapeHtml(message)}</span>
  `;
}

function clearAlert() {
  const alertBox = document.getElementById('alert-box');
  if (!alertBox) return;
  alertBox.className = 'alert';
  alertBox.innerHTML = '';
}

function copyToClipboard(text, btnElement) {
  if (!text) return;
  navigator.clipboard.writeText(String(text)).then(() => {
    if (btnElement) {
      const originalHTML = btnElement.innerHTML;
      btnElement.innerHTML = `<span style="font-size: 0.75rem; color: var(--success);">Copied!</span>`;
      setTimeout(() => {
        btnElement.innerHTML = originalHTML;
      }, 1800);
    }
  }).catch(() => {
    prompt('Copy to clipboard: Ctrl+C, Enter', text);
  });
}

// ----------------------------------------------------
// AUTHENTICATION LOGIC (login.html)
// ----------------------------------------------------
function initAuthPage() {
  initTheme();

  const form = document.getElementById('auth-form');
  const submitBtn = document.getElementById('btn-submit');
  const btnTabLogin = document.getElementById('tab-login');
  const btnTabRegister = document.getElementById('tab-register');
  const emailGroup = document.getElementById('group-email');
  const balanceGroup = document.getElementById('group-balance');
  const emailInput = document.getElementById('input-email');
  const balanceInput = document.getElementById('input-balance');
  const usernameInput = document.getElementById('input-username');
  const passwordInput = document.getElementById('input-password');

  let isRegisterMode = false;

  function setMode(register) {
    clearAlert();
    isRegisterMode = register;

    if (isRegisterMode) {
      btnTabRegister.classList.add('active');
      btnTabLogin.classList.remove('active');
      submitBtn.textContent = 'Create Wallet Account';
      emailGroup.style.display = 'block';
      balanceGroup.style.display = 'block';
      emailInput.required = true;
    } else {
      btnTabLogin.classList.add('active');
      btnTabRegister.classList.remove('active');
      submitBtn.textContent = 'Sign In to Wallet';
      emailGroup.style.display = 'none';
      balanceGroup.style.display = 'none';
      emailInput.required = false;
    }
  }

  btnTabLogin.addEventListener('click', () => setMode(false));
  btnTabRegister.addEventListener('click', () => setMode(true));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (isRegisterMode) {
      const email = emailInput.value.trim();
      const initialBalance = parseFloat(balanceInput.value) || 0.00;

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering...';

        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password, initialBalance })
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Registration failed');
        }

        const walletNum = data.wallet.walletNumber ? `Wallet #${data.wallet.walletNumber}` : 'New Wallet';
        showAlert(`Account created! ${walletNum} (UUID: ${data.wallet.id}). You can now log in.`, 'success');
        setMode(false);
        usernameInput.value = username;
        passwordInput.value = '';
      } catch (err) {
        showAlert(err.message, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = isRegisterMode ? 'Create Wallet Account' : 'Sign In to Wallet';
      }
    } else {
      // Login mode
      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';

        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Invalid credentials');
        }

        // Store session tokens
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        const walletId = data.wallet ? data.wallet.id : '';
        const walletNum = data.wallet ? data.wallet.walletNumber : '';
        sessionStorage.setItem('walletId', walletId);
        sessionStorage.setItem('walletNumber', walletNum);

        // Redirect with walletId exposed in URL
        window.location.href = `dashboard.html?walletId=${encodeURIComponent(walletId)}`;
      } catch (err) {
        showAlert(err.message, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In to Wallet';
      }
    }
  });
}

// ----------------------------------------------------
// DASHBOARD LOGIC (dashboard.html)
// ----------------------------------------------------
async function initDashboardPage() {
  initTheme();

  const token = sessionStorage.getItem('token');
  const userJson = sessionStorage.getItem('user');
  const authenticUserWalletId = sessionStorage.getItem('walletId');
  const authenticUserWalletNumber = sessionStorage.getItem('walletNumber');

  if (!token) {
    alert('Please log in to access the dashboard.');
    window.location.href = 'login.html';
    return;
  }

  // Parse user info
  let currentUser = { username: 'User' };
  if (userJson) {
    try {
      currentUser = JSON.parse(userJson);
      document.getElementById('user-display').textContent = `${currentUser.username}`;
    } catch (_) {}
  }

  // Read target walletId directly from URL query param (?walletId=<uuid_or_number>)
  const urlParams = new URLSearchParams(window.location.search);
  let activeWalletParam = urlParams.get('walletId');

  if (!activeWalletParam) {
    activeWalletParam = authenticUserWalletId;
    if (activeWalletParam) {
      window.history.replaceState({}, '', `dashboard.html?walletId=${encodeURIComponent(activeWalletParam)}`);
    } else {
      showAlert('No wallet specified in URL or session.', 'error');
      return;
    }
  }

  // Destination Mode Switching in Transfer Form
  const tabSendNum = document.getElementById('tab-send-num');
  const tabSendUuid = document.getElementById('tab-send-uuid');
  const receiverInput = document.getElementById('transfer-receiver');
  const receiverLabel = document.getElementById('label-transfer-receiver');
  const receiverHint = document.getElementById('hint-transfer-receiver');

  let sendMode = 'num'; // 'num' or 'uuid'

  if (tabSendNum && tabSendUuid) {
    tabSendNum.addEventListener('click', () => {
      sendMode = 'num';
      tabSendNum.classList.add('active');
      tabSendUuid.classList.remove('active');
      receiverLabel.textContent = 'Recipient Wallet Number';
      receiverInput.placeholder = 'e.g. 2';
      receiverHint.textContent = 'Enter the simple sequential ID (1, 2, 3...)';
      receiverInput.value = '';
    });

    tabSendUuid.addEventListener('click', () => {
      sendMode = 'uuid';
      tabSendUuid.classList.add('active');
      tabSendNum.classList.remove('active');
      receiverLabel.textContent = 'Recipient Wallet UUID';
      receiverInput.placeholder = 'e.g. 49e3168d-b5ce-421e-8e7a-c74314f6f214';
      receiverHint.textContent = 'Enter the full 36-character UUID';
      receiverInput.value = '';
    });
  }

  // Logout button
  document.getElementById('btn-logout').addEventListener('click', async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (_) {}
    sessionStorage.clear();
    window.location.href = 'login.html';
  });

  // Refresh button
  document.getElementById('btn-refresh').addEventListener('click', () => {
    loadBalance(activeWalletParam, token, authenticUserWalletId, authenticUserWalletNumber);
    loadTransactions(activeWalletParam, token);
  });

  // Transfer Form Submission
  const transferForm = document.getElementById('transfer-form');
  transferForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();

    const receiverWalletId = receiverInput.value.trim();
    const amount = parseFloat(document.getElementById('transfer-amount').value);
    const btnTransfer = document.getElementById('btn-transfer');

    try {
      btnTransfer.disabled = true;
      btnTransfer.innerHTML = `Sending...`;

      // POST /api/wallets/:walletId/transfer using activeWalletParam from URL
      const res = await fetch(`${API_BASE}/wallets/${encodeURIComponent(activeWalletParam)}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ receiverWalletId, amount })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.details || 'Transfer failed');
      }

      const tx = data.transaction;
      const destText = tx.receiver_wallet_number ? `Wallet #${tx.receiver_wallet_number}` : receiverWalletId;
      showAlert(`Transfer of PKR ${amount.toFixed(2)} to ${destText} completed successfully!`, 'success');
      document.getElementById('transfer-amount').value = '';
      loadBalance(activeWalletParam, token, authenticUserWalletId, authenticUserWalletNumber);
      loadTransactions(activeWalletParam, token);
    } catch (err) {
      showAlert(err.message, 'error');
    } finally {
      btnTransfer.disabled = false;
      btnTransfer.innerHTML = `Send Transfer`;
    }
  });

  // Initial load
  await loadBalance(activeWalletParam, token, authenticUserWalletId, authenticUserWalletNumber);
  await loadTransactions(activeWalletParam, token);
}

// ----------------------------------------------------
// API DATA LOADERS
// ----------------------------------------------------
async function loadBalance(walletParam, token, authUserWalletId, authUserWalletNumber) {
  const balanceDisplay = document.getElementById('balance-display');
  const walletIdDisplay = document.getElementById('wallet-id-display');
  const walletNumberDisplay = document.getElementById('wallet-number-display');
  const walletNumberPill = document.getElementById('wallet-number-pill');

  try {
    const res = await fetch(`${API_BASE}/wallets/${encodeURIComponent(walletParam)}/balance`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (!res.ok) {
      balanceDisplay.textContent = '0.00';
      showAlert(`Balance error: ${data.error || 'Failed to fetch balance'}`, 'error');
      return;
    }

    const num = parseFloat(data.balance);
    balanceDisplay.textContent = isNaN(num) ? data.balance : num.toFixed(2);

    // Update displays for both identifiers
    walletIdDisplay.textContent = data.walletId;
    walletNumberDisplay.textContent = `Wallet #${data.walletNumber || '?'}`;
    if (walletNumberPill) {
      walletNumberPill.textContent = `Wallet #${data.walletNumber || '?'}`;
    }

    // Setup copy buttons
    const btnCopyNum = document.getElementById('btn-copy-num');
    if (btnCopyNum) {
      btnCopyNum.onclick = () => copyToClipboard(data.walletNumber, btnCopyNum);
    }
    const btnCopyUuid = document.getElementById('btn-copy-uuid');
    if (btnCopyUuid) {
      btnCopyUuid.onclick = () => copyToClipboard(data.walletId, btnCopyUuid);
    }
  } catch (err) {
    showAlert(`Network error loading balance: ${err.message}`, 'error');
  }
}

async function loadTransactions(walletParam, token) {
  const tbody = document.getElementById('transactions-table-body');
  try {
    const res = await fetch(`${API_BASE}/wallets/${encodeURIComponent(walletParam)}/transactions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (!res.ok) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--danger);">${data.error || 'Failed to load transactions'}</td></tr>`;
      return;
    }

    const txs = data.transactions || [];
    if (txs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding: 2rem;">No transaction records found for this wallet.</td></tr>`;
      return;
    }

    const activeWalletId = data.walletId;

    tbody.innerHTML = txs.map(tx => {
      const isSent = tx.sender_wallet_id === activeWalletId;
      const directionTag = isSent
        ? `<span class="tag tag-sent">&uarr; SENT</span>`
        : `<span class="tag tag-received">&darr; RECEIVED</span>`;

      const dateStr = new Date(tx.created_at).toLocaleString();
      const amountFormatted = `PKR ${parseFloat(tx.amount).toFixed(2)}`;

      const senderDisplay = tx.sender_wallet_number
        ? `<span style="font-weight:600; color:var(--text-primary);">Wallet #${tx.sender_wallet_number}</span> <code style="font-size:0.75rem; color:var(--text-muted);">${truncateId(tx.sender_wallet_id)}</code>`
        : `<code>${truncateId(tx.sender_wallet_id)}</code>`;

      const receiverDisplay = tx.receiver_wallet_number
        ? `<span style="font-weight:600; color:var(--text-primary);">Wallet #${tx.receiver_wallet_number}</span> <code style="font-size:0.75rem; color:var(--text-muted);">${truncateId(tx.receiver_wallet_id)}</code>`
        : `<code>${truncateId(tx.receiver_wallet_id)}</code>`;

      return `
        <tr>
          <td>${dateStr}</td>
          <td>${directionTag}</td>
          <td>${senderDisplay}</td>
          <td>${receiverDisplay}</td>
          <td style="font-weight: 700; color: ${isSent ? 'var(--danger)' : 'var(--success)'};">
            ${isSent ? '-' : '+'}${amountFormatted}
          </td>
          <td><span class="tag tag-status">${escapeHtml(tx.status)}</span></td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--danger);">Network error: ${err.message}</td></tr>`;
  }
}

function truncateId(id) {
  if (!id || id.length < 16) return id || '-';
  return `${id.substring(0, 8)}...${id.substring(id.length - 6)}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}
