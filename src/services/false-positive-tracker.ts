import prisma from "@/lib/prisma";

/**
 * @title FalsePositiveTracker
 * @dev Tracks false positive incidents and automatically adjusts detection thresholds.
 */
export class FalsePositiveTracker {
  private static readonly FP_THRESHOLD = 0.001; // 0.1%

  public static async logFalsePositive(incidentId: string, detectorType: string) {
    // 1. Mark incident as false positive
    await prisma.incident.update({
      where: { id: incidentId },
      data: { status: "resolved", description: `FALSE POSITIVE: ${detectorType}` }
    });

    // 2. Track frequency
    const totalPauses = await prisma.incident.count({
      where: { type: "exploit", status: "contained" }
    });
    
    const falsePositives = await prisma.incident.count({
      where: { description: { contains: "FALSE POSITIVE" } }
    });

    const fpRate = falsePositives / (totalPauses || 1);

    if (fpRate > this.FP_THRESHOLD) {
      console.warn(`CRITICAL: False positive rate (${(fpRate * 100).toFixed(2)}%) exceeds threshold. Disabling detector: ${detectorType}`);
      // In real implementation, this would trigger an update to ExploitDetector config
    }
  }
}
