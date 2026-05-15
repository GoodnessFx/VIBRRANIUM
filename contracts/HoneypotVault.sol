// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title HoneypotVault
 * @dev Attacker Detection Trap designed to look exploitable.
 * Any interaction is logged and reported to the VIBRANIUM monitoring system.
 */
contract HoneypotVault is ReentrancyGuard {
    mapping(address => bool) public hasInteracted;
    address[] public interactors;
    bool public visible = true;

    event InteractionDetected(address indexed interactor, string method, uint256 value, bytes data);
    event FundsTrapTriggered(address indexed attacker, uint256 amount);

    /**
     * @dev Fallback function to trap simple transfers.
     */
    receive() external payable {
        _logInteraction("receive", msg.value, "");
    }

    fallback() external payable {
        _logInteraction("fallback", msg.value, msg.data);
    }

    /**
     * @dev A function that looks like a vulnerable withdrawal.
     */
    function withdraw(uint256 amount) external nonReentrant {
        // This looks like it could be exploited but it's just a trap.
        // It doesn't actually check balance or state in a way that allows real drain.
        _logInteraction("withdraw", amount, "");
        emit FundsTrapTriggered(msg.sender, amount);
        
        // No actual funds are transferred unless the contract is seeded with dust.
        // In a real scenario, we might return a small amount to encourage further attempts.
    }

    /**
     * @dev Looks like an unprotected initialization function.
     */
    function initialize(address _owner) external {
        // Attackers love uninitialized contracts.
        _logInteraction("initialize", 0, abi.encode(_owner));
    }

    function _logInteraction(string memory method, uint256 value, bytes memory data) internal {
        if (!hasInteracted[msg.sender]) {
            hasInteracted[msg.sender] = true;
            interactors.push(msg.sender);
        }
        emit InteractionDetected(msg.sender, method, value, data);
    }

    function getInteractorsCount() external view returns (uint256) {
        return interactors.length;
    }

    function getInteractors() external view returns (address[] memory) {
        return interactors;
    }
}
