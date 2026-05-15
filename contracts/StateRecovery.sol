// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title StateRecovery
 * @dev Rollback System for protected contracts.
 * Stores state snapshots and manages recovery procedures.
 */
contract StateRecovery is AccessControl {
    bytes32 public constant SNAPSHOT_ROLE = keccak256("SNAPSHOT_ROLE");
    bytes32 public constant RECOVERY_ROLE = keccak256("RECOVERY_ROLE");

    struct Snapshot {
        uint256 timestamp;
        bytes32 stateRoot;
        string dataUri; // Off-chain storage link for full state
        bool isClean;
    }

    // Mapping: targetContract => snapshotIndex => Snapshot
    mapping(address => Snapshot[]) public snapshots;
    
    uint256 public constant DISPUTE_WINDOW = 72 hours;

    event SnapshotCreated(address indexed target, uint256 index, bytes32 stateRoot);
    event RollbackInitiated(address indexed target, uint256 fromIndex, uint256 toIndex);
    event SnapshotDisputed(address indexed target, uint256 index, string reason);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(SNAPSHOT_ROLE, admin);
        _grantRole(RECOVERY_ROLE, admin);
    }

    /**
     * @dev Creates a new state snapshot for a contract.
     */
    function createSnapshot(address target, bytes32 stateRoot, string calldata dataUri) external onlyRole(SNAPSHOT_ROLE) {
        snapshots[target].push(Snapshot({
            timestamp: block.timestamp,
            stateRoot: stateRoot,
            dataUri: dataUri,
            isClean: true
        }));

        emit SnapshotCreated(target, snapshots[target].length - 1, stateRoot);
    }

    /**
     * @dev Disputs a snapshot if it's found to be corrupted or part of an exploit.
     */
    function disputeSnapshot(address target, uint256 index, string calldata reason) external onlyRole(RECOVERY_ROLE) {
        require(index < snapshots[target].length, "Invalid snapshot index");
        require(block.timestamp <= snapshots[target][index].timestamp + DISPUTE_WINDOW, "Dispute window closed");
        
        snapshots[target][index].isClean = false;
        emit SnapshotDisputed(target, index, reason);
    }

    /**
     * @dev Initiates a rollback to a specific clean snapshot.
     */
    function initiateRollback(address target, uint256 toIndex) external onlyRole(RECOVERY_ROLE) {
        require(toIndex < snapshots[target].length, "Invalid snapshot index");
        require(snapshots[target][toIndex].isClean, "Cannot rollback to dirty snapshot");

        uint256 fromIndex = snapshots[target].length - 1;
        emit RollbackInitiated(target, fromIndex, toIndex);
        
        // In a real scenario, this would trigger an off-chain process or call the target contract
        // if it supports a setInternalState(bytes) interface.
    }

    function getSnapshotCount(address target) external view returns (uint256) {
        return snapshots[target].length;
    }

    function getLatestSnapshot(address target) external view returns (Snapshot memory) {
        require(snapshots[target].length > 0, "No snapshots found");
        return snapshots[target][snapshots[target].length - 1];
    }
}
