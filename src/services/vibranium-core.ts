import { BlockchainService } from "./blockchain";
import { ExploitDetector, ExploitResult } from "./exploit-detector";
import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { ethers } from "ethers";
import { incidentQueue } from "@/lib/queue";
import { AlertService } from "./alert-service";

export class VibraniumCore {
  private blockchainService: BlockchainService;
  private exploitDetector: ExploitDetector;
  private alertService: AlertService;

  constructor() {
    this.validateEnv();
    this.blockchainService = new BlockchainService(
      process.env.ALCHEMY_ETHEREUM_WS_URL || "",
      process.env.QUICKNODE_RPC_URL || "",
      true
    );
    this.exploitDetector = new ExploitDetector();
    this.alertService = new AlertService();
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
    console.log("Starting VIBRANIUM Core monitoring...");
    this.blockchainService.onPendingTransaction(async (tx) => {
      if (!tx.to) return;
      
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
    });
  }

  private async processTransaction(tx: ethers.TransactionResponse, contract: any) {
    const startTime = Date.now();
    const result = await this.exploitDetector.analyzeTransaction(tx, contract);
    
    if (result.isExploit) {
      console.warn(`Exploit detected for contract ${contract.address}: ${result.type}`);
      await this.respond(contract, tx, result, startTime);
    }
  }

  private async respond(contract: any, tx: ethers.TransactionResponse, result: ExploitResult, startTimeMs: number) {
    const startMs = Date.now();
    
    // Step 1: Create Incident record immediately (status: active)
    const incident = await prisma.incident.create({
      data: {
        protocolId: contract.protocolId,
        contractId: contract.id,
        type: "exploit",
        severity: "critical",
        status: "active",
        description: result.reason || `Exploit of type ${result.type} detected and contract paused.`,
        txHash: tx.hash,
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
          actorId: "VIBRANIUM_CORE",
          entityType: "incident",
          entityId: incident.id,
          details: { responseTimeMs, txHash: pauseTx.hash },
        },
      });

      // Step 4: Multi-channel Alerts (async)
      await this.alertService.sendAlert({ ...incident, responseTimeMs }, contract.protocol);

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
          actorId: "VIBRANIUM_CORE",
          entityType: "contract",
          entityId: contract.id,
          details: { error: String(error) },
        },
      });

      // Escalated alert for failure
      await this.alertService.sendAlert({ 
        ...incident, 
        status: "FAILED", 
        description: "PAUSE TX FAILED — MANUAL INTERVENTION REQUIRED" 
      }, contract.protocol);
    }
  }
}
