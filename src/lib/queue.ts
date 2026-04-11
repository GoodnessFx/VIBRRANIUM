import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { ForensicsService } from "@/services/forensics";
import prisma from "@/lib/prisma";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379");

export const incidentQueue = new Queue("incident-handling", { connection });

export const incidentWorker = new Worker(
  "incident-handling",
  async (job: Job) => {
    const { incidentId, txHash, contractAddress } = job.data;
    const forensicsService = new ForensicsService();

    console.log(`Processing incident forensics and code fix for ${incidentId}...`);
    
    // 1. Generate Forensic Report
    const report = await forensicsService.generateReport(
      incidentId,
      txHash,
      contractAddress
    );

    // 2. Suggest Code Fix (assuming we can get the vulnerable code somehow, mock for now)
    const vulnerableCode = "// Fetch from Etherscan/sourcify in production";
    const codeFix = await forensicsService.suggestCodeFix(
      vulnerableCode,
      "exploit",
      report.attackVector
    );

    await prisma.incident.update({
      where: { id: incidentId },
      data: { 
        forensicReport: JSON.stringify(report),
        mitigationAction: JSON.stringify(codeFix),
      },
    });

    console.log(`Forensics and Code Fix generated for incident ${incidentId}`);
  },
  { connection }
);
