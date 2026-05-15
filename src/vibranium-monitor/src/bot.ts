import { ethers } from "ethers";
import { ReentrancyDetector } from "./detectors/reentrancy";
import { FlashLoanDetector } from "./detectors/flashloan";
import { OracleDetector } from "./detectors/oracle";
import { BotCoordinator } from "../../services/bot-coordinator";
import { ExploitResult } from "../../services/exploit-detector";

/**
 * @title VibraniumBot
 * @dev Main bot logic for monitoring and analyzing transactions.
 */
export class VibraniumBot {
  private provider: ethers.JsonRpcProvider;
  private coordinator: BotCoordinator;
  private instanceId: string;

  constructor(rpcUrl: string, instanceId: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.instanceId = instanceId;
    this.coordinator = new BotCoordinator(instanceId);
  }

  public async start() {
    console.log(`Bot ${this.instanceId} started monitoring...`);
    
    // Heartbeat every 30s
    setInterval(() => this.coordinator.sendHeartbeat(), 30000);

    this.provider.on("pending", async (txHash: string) => {
      try {
        const tx = await this.provider.getTransaction(txHash);
        if (!tx) return;

        const result = await this.analyzeTransaction(tx);
        
        if (result.score > 60) {
          const { shouldPause, score: consensusScore } = await this.coordinator.submitDetection(txHash, result);
          if (shouldPause) {
            console.warn(`CONSENSUS REACHED: Pausing contract due to score ${consensusScore}`);
            // Trigger responder logic here
          }
        }
      } catch (error) {
        console.error(`Error processing tx ${txHash}:`, error);
      }
    });
  }

  private async analyzeTransaction(tx: ethers.TransactionResponse): Promise<ExploitResult> {
    const scoreBreakdown: Record<string, number> = {};
    
    scoreBreakdown["reentrancy"] = await ReentrancyDetector.analyze(tx);
    scoreBreakdown["flashloan"] = await FlashLoanDetector.analyze(tx);
    scoreBreakdown["oracle"] = await OracleDetector.analyze(tx);
    
    const totalScore = Object.values(scoreBreakdown).reduce((a, b) => a + b, 0);
    const normalizedScore = Math.min(totalScore, 100);

    return {
      isExploit: normalizedScore >= 95,
      score: normalizedScore,
      scoreBreakdown
    };
  }
}
