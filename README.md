# Secure Fintech Wallet

A secure, full-stack fintech wallet application built with Node.js, Express, PostgreSQL, Vanilla HTML/CSS/JS, JWT authentication, and bcrypt.

The architecture is structured to systematically demonstrate core application security weaknesses (IDOR, plaintext passwords, SQL injection, concurrency race conditions, lack of input validation, and missing audit logging) and verify their corresponding defense-in-depth mitigations.

---

## Project Architecture

```text
secure-wallet/
  server/
    src/
      routes/         # Express route definitions
      controllers/    # Business logic & query execution
      db/
        pool.js       # PostgreSQL pg Pool configuration
        init.js       # Database schema initialization runner
      middleware/     # Auth & validation middleware
      server.js       # Express server entry point
    .env.example      # Environment variable template
    package.json      # Backend dependencies and scripts
  client/
    index.html        # Landing page
    login.html        # Authentication UI
    dashboard.html    # Wallet dashboard & transfer interface
    css/
      style.css       # Responsive dark/light theme styling
    js/
      main.js         # Frontend API integration logic
  db/
    schema.sql        # PostgreSQL schema definitions
  README.md
```

---

## Prerequisites & Installation

### 1. PostgreSQL Setup

Ensure PostgreSQL (v16+) is installed and running on your system.

#### Windows
```powershell
# Start using pg_ctl:
& "C:\Program Files\PostgreSQL\16\bin\pg_ctl.exe" -D "C:\Program Files\PostgreSQL\16\data" start

# Or using Windows Services (Admin prompt):
Start-Service -Name postgresql-x64-16
```

#### macOS (Homebrew)
```bash
brew services start postgresql@16
```

#### Linux
```bash
sudo systemctl start postgresql
```

---

### 2. Database Initialization

1. Connect to PostgreSQL and create the database:
   ```sql
   CREATE DATABASE secure_wallet;
   ```
2. Navigate to `server/` and apply the database schema:
   ```bash
   cd server
   npm run db:init
   ```

---

### 3. Server Configuration (`.env`)

Configure `server/.env` with your database connection parameters:

```env
PORT=4000
DB_HOST=127.0.0.1
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=secure_wallet
JWT_SECRET=supersecretjwtkey_change_in_production_12345!
```

---

### 4. Running the Application

#### Development Mode (auto-reload):
```bash
npm run dev
```

#### Production Mode:
```bash
npm start
```

Once started, access the application in your browser at:
```text
http://localhost:4000/
```

Health check verification:
```bash
curl http://localhost:4000/api/health
```

