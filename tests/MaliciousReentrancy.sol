// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../contracts/VibraniumGuard.sol";

/**
 * @title MaliciousReentrancy
 * @dev A contract designed to exploit reentrancy vulnerabilities.
 */
contract MaliciousReentrancy {
    VibraniumGuard public target;
    uint256 public attackCount;
    uint256 public constant MAX_ATTACKS = 5;

    constructor(address _target) {
        target = VibraniumGuard(_target);
    }

    function attack(address victimContract, bytes calldata data) external {
        target.guardTransaction(victimContract, data);
    }

    // Fallback function to trigger reentrancy
    fallback() external payable {
        if (attackCount < MAX_ATTACKS) {
            attackCount++;
            // Try to re-enter guardTransaction
            target.guardTransaction(address(this), "");
        }
    }
}
