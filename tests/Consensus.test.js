const { expect } = require("chai");
const { BotCoordinator } = require("../src/services/bot-coordinator");
const Redis = require("ioredis-mock");

describe("BotCoordinator Consensus Mechanism", function () {
  let coordinator1, coordinator2, coordinator3;
  const txHash = "0x" + "1".repeat(64);

  beforeEach(function () {
    // Use ioredis-mock for testing
    const redis = new Redis();
    coordinator1 = new BotCoordinator("bot-1");
    coordinator2 = new BotCoordinator("bot-2");
    coordinator3 = new BotCoordinator("bot-3");
    
    // Inject mock redis
    coordinator1.redis = redis;
    coordinator2.redis = redis;
    coordinator3.redis = redis;
  });

  it("Should not reach consensus with only 1 bot", async function () {
    const result = { score: 100, isExploit: true, scoreBreakdown: {} };
    const { shouldPause } = await coordinator1.submitDetection(txHash, result);
    expect(shouldPause).to.be.false;
  });

  it("Should reach consensus with 2/3 bots agreeing", async function () {
    const result1 = { score: 100, isExploit: true, scoreBreakdown: {} };
    const result2 = { score: 95, isExploit: true, scoreBreakdown: {} };
    
    await coordinator1.submitDetection(txHash, result1);
    const { shouldPause, score } = await coordinator2.submitDetection(txHash, result2);
    
    expect(shouldPause).to.be.true;
    expect(score).to.equal(97.5);
  });

  it("Should not reach consensus if scores are too low", async function () {
    const result1 = { score: 50, isExploit: false, scoreBreakdown: {} };
    const result2 = { score: 60, isExploit: false, scoreBreakdown: {} };
    
    await coordinator1.submitDetection(txHash, result1);
    const { shouldPause } = await coordinator2.submitDetection(txHash, result2);
    
    expect(shouldPause).to.be.false;
  });
});
