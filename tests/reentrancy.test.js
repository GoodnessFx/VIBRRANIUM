const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VibraniumGuard Reentrancy Protection", function () {
  let guard;
  let multiSig;
  let oracle;
  let attacker;
  let admin, user1, user2;

  beforeEach(async function () {
    [admin, user1, user2] = await ethers.getSigners();

    // Deploy mock multi-sig and oracle
    const MultiSig = await ethers.getContractFactory("MultiSigAdmin");
    multiSig = await MultiSig.deploy([admin.address, user1.address, user2.address, admin.address, admin.address]);

    const Oracle = await ethers.getContractFactory("ConsensusOracle");
    oracle = await Oracle.deploy([admin.address, admin.address, admin.address, admin.address, admin.address], admin.address);

    const Guard = await ethers.getContractFactory("VibraniumGuard");
    guard = await Guard.deploy(await multiSig.getAddress(), await oracle.getAddress());

    const Attacker = await ethers.getContractFactory("MaliciousReentrancy");
    attacker = await Attacker.deploy(await guard.getAddress());
    
    // Set protection status
    await guard.setProtectionStatus(await attacker.getAddress(), true);
  });

  it("Should block reentrancy in guardTransaction", async function () {
    // This should fail with "ReentrancyGuard: reentrant call"
    await expect(attacker.attack(await attacker.getAddress(), "0x"))
      .to.be.revertedWithCustomError(guard, "ReentrancyGuardReentrantCall");
  });
});
