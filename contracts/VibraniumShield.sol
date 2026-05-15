// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./VibraniumGuard.sol";

/**
 * @title VibraniumShield
 * @dev Base contract for protocols to inherit from to enable VIBRANIUM protection.
 */
abstract contract VibraniumShield is AccessControl {
    VibraniumGuard public immutable guard;
    
    error ProtectedActionBlocked(string reason);

    modifier protected() {
        (bool isProtected, uint256 threatLevel) = guard.getProtectionStatus(address(this));
        if (isProtected && threatLevel >= guard.MAX_THREAT_LEVEL()) {
            revert ProtectedActionBlocked("High threat level detected");
        }
        _;
        
        // Post-interaction state validation
        guard.validateState(address(this));
    }

    constructor(address _guard) {
        guard = VibraniumGuard(_guard);
    }
}
