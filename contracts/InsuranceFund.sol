// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title InsuranceFund
 * @dev Protected Payout System for protocols covered by VIBRANIUM.
 */
contract InsuranceFund is ReentrancyGuard, AccessControl, Pausable {
    bytes32 public constant CLAIM_MANAGER_ROLE = keccak256("CLAIM_MANAGER_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    uint256 public totalFunds;
    uint256 public totalPaidOut;
    uint256 public constant MAX_SINGLE_CLAIM = 100 ether;

    struct Claim {
        uint256 amount;
        uint256 timestamp;
        string evidence;
        bool approved;
        bool processed;
        uint256 approvalCount;
    }

    mapping(bytes32 => Claim) public claims;
    mapping(bytes32 => mapping(address => bool)) public claimApprovals;

    event FundsDeposited(address indexed sender, uint256 amount);
    event ClaimSubmitted(bytes32 indexed claimId, address indexed claimant, uint256 amount);
    event ClaimApproved(bytes32 indexed claimId, address indexed approver);
    event PayoutExecuted(bytes32 indexed claimId, address indexed claimant, uint256 amount);
    event EmergencyWithdrawal(address indexed recipient, uint256 amount);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(CLAIM_MANAGER_ROLE, admin);
        _grantRole(EMERGENCY_ROLE, admin);
    }

    receive() external payable {
        totalFunds += msg.value;
        emit FundsDeposited(msg.sender, msg.value);
    }

    function deposit() external payable {
        totalFunds += msg.value;
        emit FundsDeposited(msg.sender, msg.value);
    }

    function submitClaim(uint256 amount, string calldata evidence) external returns (bytes32) {
        require(amount <= MAX_SINGLE_CLAIM, "Exceeds max single claim");
        require(amount <= address(this).balance, "Insufficient fund balance");

        bytes32 claimId = keccak256(abi.encodePacked(msg.sender, amount, evidence, block.timestamp));
        require(claims[claimId].timestamp == 0, "Claim already exists");

        claims[claimId] = Claim({
            amount: amount,
            timestamp: block.timestamp,
            evidence: evidence,
            approved: false,
            processed: false,
            approvalCount: 0
        });

        emit ClaimSubmitted(claimId, msg.sender, amount);
        return claimId;
    }

    function approveClaim(bytes32 claimId) external onlyRole(CLAIM_MANAGER_ROLE) {
        require(claims[claimId].timestamp != 0, "Claim not found");
        require(!claims[claimId].processed, "Claim already processed");
        require(!claimApprovals[claimId][msg.sender], "Already approved by this manager");

        claimApprovals[claimId][msg.sender] = true;
        claims[claimId].approvalCount++;

        emit ClaimApproved(claimId, msg.sender);

        // 3/5 consensus for standard payout
        if (claims[claimId].approvalCount >= 3) {
            claims[claimId].approved = true;
        }
    }

    function executeClaim(bytes32 claimId, address payable claimant) external nonReentrant {
        require(claims[claimId].approved, "Claim not approved by consensus");
        require(!claims[claimId].processed, "Already processed");

        uint256 amount = claims[claimId].amount;
        require(address(this).balance >= amount, "Insufficient balance");

        claims[claimId].processed = true;
        totalPaidOut += amount;
        totalFunds -= amount;

        (bool success, ) = claimant.call{value: amount}("");
        require(success, "Payout failed");

        emit PayoutExecuted(claimId, claimant, amount);
    }

    function emergencyWithdraw(address payable recipient) external onlyRole(EMERGENCY_ROLE) nonReentrant {
        // In a real MultiSig scenario, this function would be protected by 4/5 logic in the MultiSigAdmin
        // which calls this contract.
        uint256 amount = address(this).balance;
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Emergency withdrawal failed");
        
        emit EmergencyWithdrawal(recipient, amount);
    }
}
