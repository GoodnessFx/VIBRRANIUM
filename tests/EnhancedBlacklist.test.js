const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EnhancedBlacklist", function () {
  let blacklist;
  let admin, guardian, reporter, attacker;

  beforeEach(async function () {
    [admin, guardian, reporter, attacker] = await ethers.getSigners();

    const EnhancedBlacklist = await ethers.getContractFactory("EnhancedBlacklist");
    blacklist = await EnhancedBlacklist.deploy(admin.address);

    const GUARDIAN_ROLE = await blacklist.GUARDIAN_ROLE();
    await blacklist.grantRole(GUARDIAN_ROLE, guardian.address);
    await blacklist.setTrustedReporter(reporter.address, true);
  });

  it("Should allow trusted reporter to add to blacklist", async function () {
    await blacklist.connect(reporter).addToBlacklist(attacker.address, "Exploit attempt", 80);
    const [isBlacklisted, entry] = await blacklist.isBlacklisted(attacker.address);
    
    expect(isBlacklisted).to.be.true;
    expect(entry.confidence).to.equal(80);
    expect(entry.reason).to.equal("Exploit attempt");
  });

  it("Should allow guardian to batch blacklist", async function () {
    const attackers = [attacker.address, ethers.Wallet.createRandom().address];
    await blacklist.connect(guardian).batchBlacklist(attackers, "Consensus reached");
    
    expect((await blacklist.isBlacklisted(attackers[0]))[0]).to.be.true;
    expect((await blacklist.isBlacklisted(attackers[1]))[0]).to.be.true;
    expect((await blacklist.isBlacklisted(attackers[0]))[1].confidence).to.equal(100);
  });

  it("Should only allow admin to remove from blacklist", async function () {
    await blacklist.connect(reporter).addToBlacklist(attacker.address, "Suspicious", 70);
    
    await expect(blacklist.connect(reporter).removeFromBlacklist(attacker.address, "False positive"))
      .to.be.reverted;
      
    await blacklist.connect(admin).removeFromBlacklist(attacker.address, "Verified clean");
    expect((await blacklist.isBlacklisted(attacker.address))[0]).to.be.false;
  });
});
