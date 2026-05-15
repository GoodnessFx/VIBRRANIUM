import { ethers } from "ethers";
import { ATTACK_PATTERNS } from "../../services/pattern-library";

/**
 * @title ReentrancyDetector
 * @dev Detects reentrancy patterns in transaction calldata and execution traces.
 */
export class ReentrancyDetector {
  public static async analyze(tx: ethers.TransactionResponse): Promise<number> {
    let score = 0;
    if (!tx.data) return 0;

    const data = tx.data.toLowerCase();
    
    // Check for reentrancy selectors
    if (ATTACK_PATTERNS.REENTRANCY.selectors.some(s => data.includes(s.toLowerCase()))) {
      score += 15;
    }

    // Heuristic: Large data size often indicates complex reentrancy payloads
    if (data.length > 3000) {
      score += 15;
    }

    return score;
  }
}
