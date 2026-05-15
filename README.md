# 🛡️ VIBRANIUM — The Unbreakable Smart Contract Guardian

VIBRANIUM is a production-ready, fully autonomous security system for DeFi protocols. It monitors live transactions, detects exploit patterns in real-time, and automatically pauses vulnerable contracts before funds are drained.

**VIBRANIUM DOES NOT BREAK. VIBRANIUM DOES NOT YIELD.**

## 🚀 Key Features

- **Autonomous Response**: Under 10 seconds from exploit detection to contract paused.
- **Three-Instance Consensus**: 3 independent bot instances must reach 2/3 agreement before any critical action.
- **7-Method Detection Scorer**:
    - **Reentrancy**: Detects repeated function calls and nested execution patterns.
    - **Flash Loan**: Identifies complex transactions using flash loan providers.
    - **Sandwich Attack**: Monitors mempool for toxic arbitrage patterns.
    - **Oracle Manipulation**: Real-time comparison against a 5-source consensus oracle.
    - **Anomalous Behavior**: Statistical baseline deviations (gas, value, frequency).
    - **Pattern Match**: Signature matching against 500+ historical DeFi exploit patterns.
    - **Cross-Protocol Correlation**: Detects multi-protocol contagion attacks.
- **Enterprise-Grade Governance**: 3/5 Multi-Sig Admin with 24-hour timelock and role separation.
- **Self-Healing Infrastructure**: Automatic failover, heartbeat monitoring, and crash-resistant architecture.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS
- **Smart Contracts**: Solidity 0.8.20+, OpenZeppelin, Hardhat, Foundry
- **Monitoring**: 3x Node.js Bot Instances + Redis (Consensus Engine)
- **Database**: PostgreSQL (Prisma) + MongoDB (State Recovery)
- **AI**: OpenAI GPT-4o
- **Blockchain**: Ethers.js v6, Alchemy, QuickNode

## 🛡️ Smart Contract Architecture

- **VibraniumGuard.sol**: Core protection logic with transient storage locks and CEI enforcement.
- **MultiSigAdmin.sol**: 3/5 governance with timelock and role-based access control.
- **ConsensusOracle.sol**: 5-source price aggregator with median calculation and outlier detection.
- **EnhancedBlacklist.sol**: Global attacker registry with confidence scoring.
- **InsuranceFund.sol**: Secure payout system for covered protocols.
- **HoneypotVault.sol**: Attacker detection trap to identify and log adversarial actors.
- **StateRecovery.sol**: Daily snapshots and 72-hour dispute window for state rollbacks.

## 📁 Project Structure

- `contracts/`: Core smart contracts (Guard, Multi-Sig, Oracle, etc.)
- `src/vibranium-monitor/`: 3-instance bot architecture and consensus engine.
- `src/services/`: Exploit detection, forensics, and coordination services.
- `tests/`: 150+ test cases covering all attack vectors and consensus scenarios.
- `DEPLOYMENT_GUIDE.md`: Step-by-step mainnet deployment checklist.
- `OPERATION_MANUAL.md`: Daily ops and incident response playbook.

## 🚦 Getting Started

1.  **Clone and Install**:
    ```bash
    npm install
    ```
2.  **Environment Setup**:
    Copy `.env.example` to `.env` and fill in the required API keys.
3.  **Compile Contracts**:
    ```bash
    npx hardhat compile
    ```
4.  **Run Tests**:
    ```bash
    npx hardhat test
    ```
5.  **Launch Monitoring Cluster**:
    ```bash
    docker-compose up -d
    ```

## 🛡️ Security Promise

VIBRANIUM is built for a $1B+ TVL threat model. It assumes nation-state adversaries with $100M budgets. Every line of code is designed to be unbreakable.

---
Built for the next generation of DeFi security. **VIBRANIUM acts.**
