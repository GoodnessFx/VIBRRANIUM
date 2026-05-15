import { ethers } from "ethers";
import { ATTACK_PATTERNS } from "../../services/pattern-library";

/**
 * @title OracleDetector
 * @dev Detects potential oracle manipulation attempts.
 */
export class OracleDetector {
  public static async analyze(tx: ethers.TransactionResponse): Promise<number> {
    let score = 0;
    if (!tx.data) return 0;

    const data = tx.data.toLowerCase();
    const signals = ATTACK_PATTERNS.ORACLE_MANIPULATION.signals;
    
    let matches = 0;
    signals.forEach(s => {
      if (data.includes(s.toLowerCase())) matches++;
    });

    if (matches >= 2) {
      score += 20;
    }

    // Check for high-frequency price-related calls
    if (data.includes("getprice") && data.includes("latestrounddata")) {
      score += 5;
    }

    return score;
  }
}
