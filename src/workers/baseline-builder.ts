import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import prisma from "@/lib/prisma";
import { ethers } from "ethers";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379");

export const baselineQueue = new Queue("baseline-building", { connection });

export const baselineWorker = new Worker(
  "baseline-building",
  async (job: Job) => {
    const { contractId } = job.data;
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { transactions: true },
    });

    if (!contract || contract.transactions.length < 10) {
      console.log(`Insufficient data for contract ${contractId}. Minimum 10 transactions required.`);
      return;
    }

    console.log(`Building baseline for contract ${contractId} with ${contract.transactions.length} transactions...`);

    // 1. Gas Usage Baseline
    const gasUsages = contract.transactions.map(tx => Number(tx.gasUsed || 0)).filter(g => g > 0);
    if (gasUsages.length > 0) {
      const stats = calculateStats(gasUsages);
      await updateMetric(contractId, "gas_usage", stats);
    }

    // 2. Value Transfer Baseline
    const values = contract.transactions.map(tx => Number(ethers.formatEther(tx.value || "0")));
    const valueStats = calculateStats(values);
    await updateMetric(contractId, "value_transfer", valueStats);

    // 3. Mark baseline as established
    await prisma.contract.update({
      where: { id: contractId },
      data: {
        baselineEstablished: true,
        baselineEstablishedAt: new Date(),
      },
    });

    console.log(`Baseline established for contract ${contractId}`);
  },
  { connection }
);

function calculateStats(numbers: number[]) {
  const n = numbers.length;
  const mean = numbers.reduce((a, b) => a + b) / n;
  const stdDev = Math.sqrt(numbers.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
  const sorted = [...numbers].sort((a, b) => a - b);
  const p95 = sorted[Math.floor(n * 0.95)];
  
  return {
    mean,
    stdDev,
    p95,
    min: sorted[0],
    max: sorted[n - 1],
    avg: mean,
  };
}

async function updateMetric(contractId: string, name: string, stats: {
  mean: number;
  stdDev: number;
  p95: number;
  min: number;
  max: number;
  avg: number;
}) {
  await prisma.baselineMetric.upsert({
    where: { 
      contractId_metricName: { contractId, metricName: name }
    },
    update: {
      mean: stats.mean,
      stdDev: stats.stdDev,
      p95: stats.p95,
      minValue: stats.min,
      maxValue: stats.max,
      avgValue: stats.avg,
    },
    create: {
      contractId,
      metricName: name,
      mean: stats.mean,
      stdDev: stats.stdDev,
      p95: stats.p95,
      minValue: stats.min,
      maxValue: stats.max,
      avgValue: stats.avg,
    },
  });
}
