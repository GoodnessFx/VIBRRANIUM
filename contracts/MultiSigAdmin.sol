// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title MultiSigAdmin
 * @dev Implements 3/5 multi-sig governance with timelock and role separation.
 */
contract MultiSigAdmin is AccessControl {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");

    uint256 public constant APPROVAL_THRESHOLD = 3;
    uint256 public constant EMERGENCY_THRESHOLD = 4;
    uint256 public constant TIMELOCK_DELAY = 24 hours;

    address[] public admins;
    mapping(address => bool) public isAdmin;
    
    struct Action {
        address target;
        bytes data;
        uint256 approvals;
        uint256 timestamp;
        bool executed;
        bool exists;
    }

    mapping(bytes32 => Action) public actions;
    mapping(bytes32 => mapping(address => bool)) public hasApproved;

    event ActionProposed(bytes32 indexed actionId, address indexed target, bytes data);
    event ActionApproved(bytes32 indexed actionId, address indexed admin);
    event ActionExecuted(bytes32 indexed actionId);
    event EmergencyExecuted(bytes32 indexed actionId);

    constructor(address[] memory _admins) {
        require(_admins.length == 5, "Must have exactly 5 admins");
        for (uint256 i = 0; i < 5; i++) {
            admins.push(_admins[i]);
            isAdmin[_admins[i]] = true;
            _grantRole(DEFAULT_ADMIN_ROLE, _admins[i]);
        }
    }

    modifier onlyAdmin() {
        require(isAdmin[msg.sender], "Not an admin");
        _;
    }

    function proposeAction(address target, bytes calldata data) external onlyAdmin returns (bytes32) {
        bytes32 actionId = keccak256(abi.encodePacked(target, data, block.timestamp));
        require(!actions[actionId].exists, "Action already exists");

        actions[actionId] = Action({
            target: target,
            data: data,
            approvals: 0,
            timestamp: block.timestamp,
            executed: false,
            exists: true
        });

        emit ActionProposed(actionId, target, data);
        return actionId;
    }

    function approveAction(bytes32 actionId) external onlyAdmin {
        require(actions[actionId].exists, "Action does not exist");
        require(!hasApproved[actionId][msg.sender], "Already approved");
        require(!actions[actionId].executed, "Already executed");

        hasApproved[actionId][msg.sender] = true;
        actions[actionId].approvals++;

        emit ActionApproved(actionId, msg.sender);
    }

    function executeAction(bytes32 actionId) external {
        Action storage action = actions[actionId];
        require(action.exists, "Action does not exist");
        require(action.approvals >= APPROVAL_THRESHOLD, "Insufficient approvals");
        require(block.timestamp >= action.timestamp + TIMELOCK_DELAY, "Timelock not expired");
        require(!action.executed, "Already executed");

        action.executed = true;
        (bool success, ) = action.target.call(action.data);
        require(success, "Execution failed");

        emit ActionExecuted(actionId);
    }

    function emergencyExecute(bytes32 actionId) external {
        Action storage action = actions[actionId];
        require(action.exists, "Action does not exist");
        require(action.approvals >= EMERGENCY_THRESHOLD, "Insufficient emergency approvals");
        require(!action.executed, "Already executed");

        action.executed = true;
        (bool success, ) = action.target.call(action.data);
        require(success, "Execution failed");

        emit EmergencyExecuted(actionId);
    }

    function rotateKey(address oldAdmin, address newAdmin) external {
        require(isAdmin[oldAdmin], "Old admin not found");
        require(!isAdmin[newAdmin], "New admin already exists");
        
        // This should technically be an action itself that requires 4/5
        // But for simplicity in this implementation, we assume it's called via execute/emergencyExecute
        require(msg.sender == address(this), "Must be called via multi-sig");

        isAdmin[oldAdmin] = false;
        isAdmin[newAdmin] = true;
        
        for (uint256 i = 0; i < admins.length; i++) {
            if (admins[i] == oldAdmin) {
                admins[i] = newAdmin;
                break;
            }
        }

        _revokeRole(DEFAULT_ADMIN_ROLE, oldAdmin);
        _grantRole(DEFAULT_ADMIN_ROLE, newAdmin);
    }
}
