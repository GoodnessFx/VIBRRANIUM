import { ExploitResult } from "./exploit-detector";

/**
 * @title ConfidenceEngine
 * @dev Scores detections and determines actions based on confidence thresholds.
 */
export class ConfidenceEngine {
  public static calculateConfidence(results: ExploitResult[]): number {
    if (results.length === 0) return 0;
    
    // Average score from multiple bots
    const totalScore = results.reduce((sum, res) => sum + res.score, 0);
    return totalScore / results.length;
  }

  public static determineAction(score: number, agreementCount: number, totalBots: number): string {
    if (score >= 100 && agreementCount >= (2 * totalBots) / 3) {
      return "PAUSE";
    }
    if (score >= 95 && agreementCount >= (2 * totalBots) / 3) {
      return "PAUSE";
    }
    if (score >= 90) {
      return "THROTTLE";
    }
    if (score >= 75) {
      return "ALERT";
    }
    if (score >= 60) {
      return "WATCH";
    }
    return "IGNORE";
  }
}
