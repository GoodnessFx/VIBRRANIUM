import { ethers } from "ethers";
import { ATTACK_PATTERNS } from "../../services/pattern-library";

/**
 * @title FlashLoanDetector
 * @dev Identifies flash loan usage from known providers.
 */
export class FlashLoanDetector {
  public static async analyze(tx: ethers.TransactionResponse): Promise<number> {
    let score = 0;
    if (!tx.data) return 0;

    const data = tx.data.toLowerCase();
    
    // Check for flash loan provider selectors or addresses
    if (ATTACK_PATTERNS.FLASH_LOAN.providers.some(p => data.includes(p.toLowerCase()))) {
      score += 20;
    }

    // High value transfers combined with complex logic
    if (tx.value > ethers.parseEther("1000") && data.length > 1000) {
      score += 5;
    }

    return score;
  }
}
