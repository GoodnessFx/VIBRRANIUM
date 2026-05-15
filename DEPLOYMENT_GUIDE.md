# VIBRANIUM Deployment Guide

## Prerequisites
- Node.js 20+
- Hardhat & Foundry
- Alchemy/QuickNode RPC URLs
- 5 Admin Hardware Wallets
- Redis Instance

## Step 1: Deploy Governance & Oracles
1. **Deploy MultiSigAdmin.sol**: Provide the 5 admin addresses.
   ```bash
   npx hardhat run scripts/deploy-multisig.js --network mainnet
   ```
2. **Deploy ConsensusOracle.sol**: Reference the MultiSigAdmin address and 5 initial price feeds.
3. **Deploy EnhancedBlacklist.sol**: Reference the MultiSigAdmin address.

## Step 2: Deploy Core Protection
1. **Deploy VibraniumGuard.sol**: Reference MultiSigAdmin and ConsensusOracle.
2. **Deploy InsuranceFund.sol**: Initialize with MultiSigAdmin as the controller.
3. **Deploy HoneypotVault.sol**: (Optional) Deploy decoy contracts.

## Step 3: Configure Monitoring Bots
1. **Environment Setup**: Fill in `.env` with RPC URLs, Redis URL, and MultiSig keys.
2. **Launch 3 Instances**:
   ```bash
   docker-compose up -d --build
   ```
3. **Verify Heartbeats**: Ensure all 3 bots are visible in the `BotCoordinator`.

## Step 4: Protocol Integration
1. **Inherit VibraniumShield**: Update customer contracts to inherit from `VibraniumShield.sol`.
2. **Register Contracts**: Add customer contract addresses to `VibraniumGuard.setProtectionStatus`.
3. **Seed Insurance Fund**: Transfer initial coverage amount to `InsuranceFund.sol`.

## Step 5: Verification
1. **Verify on Etherscan**: Use `npx hardhat verify`.
2. **End-to-End Test**: Simulate a reentrancy attack on testnet and verify the 2/3 consensus pause.
