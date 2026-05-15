// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Insurance
 * @dev Manages the insurance fund for DeFi protocols protected by VIBRANIUM.
 */
contract Insurance is AccessControl, ReentrancyGuard {
    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");
    
    mapping(address => uint256) public coverageAmount;
    mapping(address => uint256) public premiumPaid;
    
    IERC20 public immutable paymentToken;

    event PremiumPaid(address indexed protocol, uint256 amount);
    event PayoutExecuted(address indexed protocol, uint256 amount);

    constructor(address _paymentToken, address admin) {
        paymentToken = IERC20(_paymentToken);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function payPremium(uint256 amount) external nonReentrant {
        require(paymentToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        premiumPaid[msg.sender] += amount;
        emit PremiumPaid(msg.sender, amount);
    }

    function executePayout(address protocol, uint256 amount) external onlyRole(TREASURER_ROLE) nonReentrant {
        require(paymentToken.transfer(protocol, amount), "Payout failed");
        emit PayoutExecuted(protocol, amount);
    }

    function updateCoverage(address protocol, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        coverageAmount[protocol] = amount;
    }
}
