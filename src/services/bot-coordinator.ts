import { Redis } from "ioredis";
import { ExploitResult } from "./exploit-detector";
import { ConfidenceEngine } from "./confidence-engine";

/**
 * @title BotCoordinator
 * @dev Manages 3 independent bot instances and requires 2/3 consensus for critical actions.
 */
export class BotCoordinator {
  private redis: Redis;
  private instanceId: string;
  private totalInstances: number = 3;

  constructor(instanceId: string) {
    this.instanceId = instanceId;
    this.redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
  }

  async sendHeartbeat() {
    await this.redis.set(`heartbeat:${this.instanceId}`, Date.now().toString(), "EX", 30);
  }

  async checkHealth(): Promise<string[]> {
    const aliveBots = [];
    for (let i = 1; i <= this.totalInstances; i++) {
      const exists = await this.redis.exists(`heartbeat:bot-${i}`);
      if (exists) aliveBots.push(`bot-${i}`);
    }
    return aliveBots;
  }

  async submitDetection(txHash: string, result: ExploitResult) {
    const key = `detection:${txHash}`;
    await this.redis.hset(key, this.instanceId, JSON.stringify(result));
    await this.redis.expire(key, 300); // Expire after 5 mins

    // Check for consensus
    const allResultsRaw = await this.redis.hgetall(key);
    const results = Object.values(allResultsRaw).map(r => JSON.parse(r) as ExploitResult);

    if (results.length >= 2) {
      const avgScore = ConfidenceEngine.calculateConfidence(results);
      const action = ConfidenceEngine.determineAction(avgScore, results.length, this.totalInstances);
      
      if (action === "PAUSE") {
        return { shouldPause: true, score: avgScore, results };
      }
    }

    return { shouldPause: false, score: 0, results };
  }
}
