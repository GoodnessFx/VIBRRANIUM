// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title EnhancedBlacklist
 * @dev Global Attacker Registry with confidence scoring and trusted reporters.
 */
contract EnhancedBlacklist is AccessControl, Pausable {
    bytes32 public constant BLACKLISTER_ROLE = keccak256("BLACKLISTER_ROLE");
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");

    struct BlacklistEntry {
        uint256 timestamp;
        string reason;
        address reporter;
        uint256 confidence; // 0-100
    }

    mapping(address => BlacklistEntry) public blacklist;
    address[] public blacklistedAddresses;
    uint256 public totalBlacklisted;
    mapping(address => bool) public trustedReporters;

    event AddedToBlacklist(address indexed attacker, string reason, uint256 confidence, address indexed reporter);
    event RemovedFromBlacklist(address indexed account, string reason);
    event TrustedReporterUpdated(address indexed reporter, bool status);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(BLACKLISTER_ROLE, admin);
        _grantRole(GUARDIAN_ROLE, admin);
    }

    function setTrustedReporter(address reporter, bool status) external onlyRole(DEFAULT_ADMIN_ROLE) {
        trustedReporters[reporter] = status;
        emit TrustedReporterUpdated(reporter, status);
    }

    /**
     * @dev Adds an address to the blacklist with a confidence score.
     */
    function addToBlacklist(address attacker, string calldata reason, uint256 confidence) external {
        require(hasRole(BLACKLISTER_ROLE, msg.sender) || trustedReporters[msg.sender], "Unauthorized reporter");
        require(confidence <= 100, "Invalid confidence score");

        if (blacklist[attacker].timestamp == 0) {
            blacklistedAddresses.push(attacker);
            totalBlacklisted++;
        }

        blacklist[attacker] = BlacklistEntry({
            timestamp: block.timestamp,
            reason: reason,
            reporter: msg.sender,
            confidence: confidence
        });

        emit AddedToBlacklist(attacker, reason, confidence, msg.sender);
    }

    /**
     * @dev Batch add to blacklist by Guardians.
     */
    function batchBlacklist(address[] calldata attackers, string calldata reason) external onlyRole(GUARDIAN_ROLE) {
        for (uint256 i = 0; i < attackers.length; i++) {
            address attacker = attackers[i];
            if (blacklist[attacker].timestamp == 0) {
                blacklistedAddresses.push(attacker);
                totalBlacklisted++;
            }
            blacklist[attacker] = BlacklistEntry({
                timestamp: block.timestamp,
                reason: reason,
                reporter: msg.sender,
                confidence: 100 // Guardians have max confidence
            });
            emit AddedToBlacklist(attacker, reason, 100, msg.sender);
        }
    }

    /**
     * @dev Removes an address from the blacklist. Requires admin privileges and a reason.
     */
    function removeFromBlacklist(address addr, string calldata reason) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(blacklist[addr].timestamp != 0, "Not blacklisted");
        
        delete blacklist[addr];
        totalBlacklisted--;
        
        // Note: address remains in blacklistedAddresses array but timestamp 0 indicates removal
        emit RemovedFromBlacklist(addr, reason);
    }

    function isBlacklisted(address addr) external view returns (bool, BlacklistEntry memory) {
        return (blacklist[addr].timestamp != 0, blacklist[addr]);
    }

    function exportBlacklist() external view returns (address[] memory, BlacklistEntry[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < blacklistedAddresses.length; i++) {
            if (blacklist[blacklistedAddresses[i]].timestamp != 0) {
                count++;
            }
        }

        address[] memory addresses = new address[](count);
        BlacklistEntry[] memory entries = new BlacklistEntry[](count);
        
        uint256 index = 0;
        for (uint256 i = 0; i < blacklistedAddresses.length; i++) {
            address addr = blacklistedAddresses[i];
            if (blacklist[addr].timestamp != 0) {
                addresses[index] = addr;
                entries[index] = blacklist[addr];
                index++;
            }
        }
        
        return (addresses, entries);
    }
}
