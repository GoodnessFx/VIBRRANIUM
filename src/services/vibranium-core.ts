import { BlockchainService } from "./blockchain";
import { ExploitDetector, ExploitResult } from "./exploit-detector";
import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { ethers } from "ethers";
import { incidentQueue } from "@/lib/queue";
import { AlertService } from "./alert-service";
import { BotCoordinator } from "./bot-coordinator";

export class VibraniumCore {
  private blockchainService: BlockchainService;
  private exploitDetector: ExploitDetector;
  private alertService: AlertService;
  private coordinator: BotCoordinator;
  private instanceId: string;

  constructor(instanceId: string = "bot-1") {
    this.validateEnv();
    this.instanceId = instanceId;
    this.blockchainService = new BlockchainService(
      process.env.ALCHEMY_ETHEREUM_WS_URL || "",
      process.env.QUICKNODE_RPC_URL || "",
      true
    );
    this.exploitDetector = new ExploitDetector();
    this.alertService = new AlertService();
    this.coordinator = new BotCoordinator(this.instanceId);
  }

  private validateEnv() {
    const required = [
      "DATABASE_URL",
      "REDIS_URL",
      "CLERK_SECRET_KEY",
      "ALCHEMY_ETHEREUM_WS_URL",
      "QUICKNODE_RPC_URL",
      "EMERGENCY_KEYPAIR_ENCRYPTION_KEY",
      "VIBRANIUM_PAUSER_ADDRESS"
    ];

    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      console.error(`FATAL: Missing environment variables: ${missing.join(", ")}`);
      process.exit(1);
    }
  }

  async startMonitoring() {
    console.log(`Starting VIBRANIUM Core monitoring (Instance: ${this.instanceId})...`);
    
    // Start heartbeat
    setInterval(() => this.coordinator.sendHeartbeat(), 30000);

    this.blockchainService.onPendingTransaction(async (tx) => {
      if (!tx.to) return;
      
      try {
        const contract = await prisma.contract.findUnique({
          where: { 
            address_chain: { 
              address: tx.to.toLowerCase(), 
              chain: "ethereum"
            }
          },
          include: { protocol: true },
        });

        if (contract && !contract.paused) {
          await this.processTransaction(tx, contract);
        }
      } catch (error) {
        console.error(`Error in monitoring loop for tx ${tx.hash}:`, error);
      }
    });
  }

  private async processTransaction(tx: ethers.TransactionResponse, contract: {
    id: string;
    address: string;
    protocolId: string;
    paused: boolean;
    abi: unknown;
    protocol: {
      name: string;
      telegramChatId: string | null;
      slackWebhookUrl: string | null;
      pagerdutyKey: string | null;
      teamEmails: string[];
      tvlUsd: number;
    };
    encryptedEmergencyKey: string | null;
    emergencyKeyIv: string | null;
    emergencyKeyTag: string | null;
  }) {
    try {
      const startTime = Date.now();
      const result = await this.exploitDetector.analyzeTransaction(tx, contract);
      
      // Submit to coordinator for consensus
      const { shouldPause, score, results } = await this.coordinator.submitDetection(tx.hash, result);
      
      if (shouldPause) {
        console.warn(`Consensus reached! Exploit detected for contract ${contract.address}. Score: ${score}`);
        await this.respond(contract, tx, result, startTime);
      } else if (result.score > 75) {
        console.info(`Suspicious transaction detected (${result.score}), awaiting consensus...`);
        // Log suspicious activity
        await prisma.auditLog.create({
          data: {
            action: "suspicious_tx",
            actorType: "system",
            actorId: this.instanceId,
            entityType: "transaction",
            entityId: tx.hash,
            details: { score: result.score, breakdown: result.scoreBreakdown },
          },
        });
      }
    } catch (error) {
      console.error(`Error processing transaction ${tx.hash}:`, error);
    }
  }

  private async respond(contract: {
    id: string;
    address: string;
    protocolId: string;
    abi: unknown;
    protocol: {
      name: string;
      telegramChatId: string | null;
      slackWebhookUrl: string | null;
      pagerdutyKey: string | null;
      teamEmails: string[];
      tvlUsd: number;
    };
    encryptedEmergencyKey: string | null;
    emergencyKeyIv: string | null;
    emergencyKeyTag: string | null;
  }, tx: ethers.TransactionResponse, result: ExploitResult, startTimeMs: number) {
    // Step 1: Create Incident record immediately (status: active)
    const incident = await prisma.incident.create({
      data: {
        protocolId: contract.protocolId,
        contractId: contract.id,
        type: result.type || "exploit",
        severity: "critical",
        status: "active",
        description: result.reason || `Exploit of type ${result.type} detected and contract paused.`,
        txHash: tx.hash,
        score: result.score,
      },
    });

    // Step 2: Pause — decrypt key, send pause tx, retry with 3x gas
    if (!contract.encryptedEmergencyKey) {
      console.error(`Emergency key not found for contract ${contract.address}. Manual intervention required.`);
      return;
    }

    const privateKey = decrypt({
      encrypted: contract.encryptedEmergencyKey,
      iv: contract.emergencyKeyIv!,
      tag: contract.emergencyKeyTag!,
    });
    
    try {
      const pauseTx = await this.blockchainService.pauseContract(contract.address, contract.abi, privateKey, result.type || "unknown");
      
      const responseTimeMs = Date.now() - startTimeMs;
      
      // Step 3: Update DB (status: contained)
      await prisma.incident.update({
        where: { id: incident.id },
        data: { 
          status: "contained",
          pausedAt: new Date(),
          responseTimeMs,
        },
      });

      await prisma.contract.update({
        where: { id: contract.id },
        data: { 
          paused: true, 
          pausedAt: new Date(), 
          pausedReason: result.type 
        },
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          action: "contract_paused",
          actorType: "system",
          actorId: this.instanceId,
          entityType: "incident",
          entityId: incident.id,
          details: { responseTimeMs, txHash: pauseTx.hash, score: result.score },
        },
      });

      // Step 4: Multi-channel Alerts (async)
      await this.alertService.sendAlert({ 
        id: incident.id,
        type: incident.type,
        txHash: incident.txHash ?? undefined,
        responseTimeMs: responseTimeMs ?? undefined,
        contractId: incident.contractId,
        status: incident.status
      }, {
        name: contract.protocol.name,
        telegramChatId: contract.protocol.telegramChatId ?? undefined,
        slackWebhookUrl: contract.protocol.slackWebhookUrl ?? undefined,
        pagerdutyKey: contract.protocol.pagerdutyKey ?? undefined,
        teamEmails: contract.protocol.teamEmails,
        tvlUsd: contract.protocol.tvlUsd
      });

      // Step 5: Queue forensic analysis
      await incidentQueue.add("handle-incident", {
        incidentId: incident.id,
        txHash: tx.hash,
        contractAddress: contract.address,
      });

      console.log(`Exploit mitigated in ${responseTimeMs}ms.`);

    } catch (error) {
      console.error(`Emergency response failed for ${contract.address}:`, error);
      
      await prisma.auditLog.create({
        data: {
          action: "pause_failed",
          actorType: "system",
          actorId: this.instanceId,
          entityType: "contract",
          entityId: contract.id,
          details: { error: String(error) },
        },
      });

      // Escalated alert for failure
      await this.alertService.sendAlert({ 
        id: incident.id,
        type: incident.type,
        txHash: incident.txHash ?? undefined,
        contractId: incident.contractId,
        status: "FAILED" 
      }, {
        name: contract.protocol.name,
        telegramChatId: contract.protocol.telegramChatId ?? undefined,
        slackWebhookUrl: contract.protocol.slackWebhookUrl ?? undefined,
        pagerdutyKey: contract.protocol.pagerdutyKey ?? undefined,
        teamEmails: contract.protocol.teamEmails,
        tvlUsd: contract.protocol.tvlUsd
      });
    }
  }
}
