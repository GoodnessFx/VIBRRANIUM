# VIBRANIUM Operations Manual

## System Overview
VIBRANIUM is a multi-layered security system consisting of on-chain guard contracts and an off-chain 3-instance monitoring bot consensus.

## Daily Operations (8 AM Check)
1. **Bot Health**: Ensure all 3 bot instances are running and sending heartbeats.
   - Run `docker-compose ps` to check status.
   - Check Redis for `heartbeat:*` keys.
2. **Detection Review**: Review all detections with score > 60 in the dashboard.
   - Investigate any "Alert" or "Watch" level incidents.
3. **Insurance Fund**: Verify the balance of `InsuranceFund.sol`.
4. **Oracle Health**: Check `ConsensusOracle.sol` reliability scores for all 5 feeds.
5. **Admin Approvals**: Review any pending actions in `MultiSigAdmin.sol`.

## Incident Response Playbook

### First 5 Minutes (Detection)
- **Verify Consensus**: Confirm if 2/3 bots agreed on the threat.
- **Notify Team**: Immediate alert via Telegram/Slack/PagerDuty.
- **Assess Scope**: Identify which contracts are affected and the current TVL at risk.

### First 30 Minutes (Containment)
- **Initiate Throttling**: Use `VibraniumGuard.updateThreatLevel` to slow down interactions.
- **Protocol Contact**: Reach out to the founders of the affected protocol.
- **Evidence Collection**: Gather all transaction hashes and attacker addresses.

### First 2 Hours (Mitigation)
- **Execute Pause**: If the attack is confirmed and the bot hasn't paused automatically, manually trigger the pause via MultiSig.
- **Global Blacklist**: Add attacker addresses to `EnhancedBlacklist.sol`.
- **Public Communication**: Issue a preliminary statement on Twitter/Discord.

## Security Procedures
- **Key Management**: All `MultiSigAdmin` keys MUST be stored on hardware wallets (Ledger/Trezor).
- **Snapshot Disputing**: If an exploit happens, use `StateRecovery.disputeSnapshot` within the 72-hour window.
- **False Positive Handling**: If a legitimate transaction is flagged, use `FalsePositiveTracker` to adjust thresholds.

## Maintenance
- **Weekly Pattern Sync**: Update `pattern-library.ts` with the latest signatures from DeFiHackLabs and Immunefi.
- **Monthly Audit**: Perform a self-audit of all access control roles and permissions.
