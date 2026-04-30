# 🛡️ VIBRANIUM — Autonomous Smart Contract Guardian

VIBRANIUM is a production-ready, fully autonomous security system for DeFi protocols. It monitors live transactions, detects exploit patterns in real-time, and automatically pauses vulnerable contracts before funds are drained.
VIBRANIUM DOES NOT BREAK. VIBRANIUM DOES NOT YIELD.
## 🚀 Key Features

- **Autonomous Response**: Under 10 seconds from exploit detection to contract paused.
- **Advanced Exploit Detection**: Combines heuristic rules, statistical baseline deviations, and AI-powered analysis (GPT-4o).
- **Multi-Chain Support**: Ethereum, Base, Arbitrum, Polygon, and BSC.
- **Smart Response**: Automatic gas retries (up to 3x) for pause transactions.
- **AI-Powered Forensics**: Automatic generation of technical forensic reports and suggested code fixes.
- **Enterprise-Grade Security**: AES-256-GCM encryption for emergency keys, audit logging for all critical actions.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS
- **Auth**: Clerk (Production-ready)
- **Database**: PostgreSQL + Prisma ORM
- **Queue**: Redis + BullMQ
- **Blockchain**: Ethers.js v6
- **AI**: OpenAI GPT-4o
- **Alerts**: Telegram, Slack, PagerDuty, Resend (Email)
- **PDF**: Puppeteer

## 🛡️ How It Works (Monitor → Detect → Pause)

VIBRANIUM follows a three-step process to protect your protocol:

### 1. **Monitor**
- **WebSocket Subscriptions**: Monitors the mempool via Alchemy/QuickNode on 5 chains.
- **Failover Logic**: Automatically switches to QuickNode if Alchemy rate limits or disconnects.
- **Reconnect with Backoff**: WebSocket reconnects with exponential backoff (starting at 1s, max 30s).

### 2. **Detect**
- **6-Pattern Scorer**:
    - **Reentrancy**: Detects repeated function calls in a single transaction.
    - **Flash Loan**: Identifies complex transactions using flash loan providers.
    - **Oracle Manipulation**: Monitors for multiple price-related calls in a single transaction.
    - **Access Control**: Detects unauthorized ownership transfers or proxy upgrades.
    - **Logic Exploits**: Statistical baseline deviations (gas, value, frequency).
    - **Value Extraction**: Flags large `withdrawAll` or abnormal value transfers.
- **AI-Powered (GPT-4o)**: Suspicious transactions are analyzed by AI for hidden exploit patterns.
- **Baseline Building**: Builds a statistical profile for every contract over 48 hours for precise detection.

### 3. **Pause**
- **Autonomous Response**: If an exploit is detected, VIBRANIUM decrypts the emergency key and sends a `pause` transaction.
- **3x Gas Retry**: If the initial pause fails, VIBRANIUM retries up to 3x with increasing gas (1x → 2x → 3x).
- **Audit Logging**: Every action (detect, pause, fail, alert) is logged to a tamper-proof `AuditLog` table.
- **False Positive Calibration**: Teams can mark incidents as false positives, automatically adjusting scoring thresholds.

## 📁 Project Structure

- `src/app`: Next.js pages and API routes.
- `src/services`: Core logic (VibraniumCore, ExploitDetector, Forensics).
- `src/workers`: Background workers for baseline building and incident handling.
- `src/lib`: Shared utilities (Prisma, Stripe, Queue, Crypto).
- `prisma/schema.prisma`: Database model with auditability and scoring support.

## 🚦 Getting Started

1.  **Clone and Install**:
    ```bash
    npm install
    ```
2.  **Environment Setup**:
    Copy `.env.example` to `.env` and fill in the required API keys (Alchemy, OpenAI, Clerk, Stripe, etc.).
3.  **Database Migration**:
    ```bash
    npx prisma migrate dev
    ```
4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
5.  **Start VIBRANIUM Worker**:
    ```bash
    npx ts-node src/worker.ts
    ```

## 🛡️ Security Promise

VIBRANIUM only requires permissions to `pause` your contracts. It never has access to your funds. The emergency keypair is generated client-side and encrypted before ever reaching our servers.

---
Built for the next generation of DeFi security. **VIBRANIUM acts.**
