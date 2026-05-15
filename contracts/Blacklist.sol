// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title Blacklist
 * @dev Global blacklist for known attacker addresses.
 */
contract Blacklist is AccessControl {
    bytes32 public constant BLACKLISTER_ROLE = keccak256("BLACKLISTER_ROLE");

    mapping(address => bool) public isBlacklisted;

    event AddressBlacklisted(address indexed account, bool status);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(BLACKLISTER_ROLE, admin);
    }

    function setBlacklistStatus(address account, bool status) external onlyRole(BLACKLISTER_ROLE) {
        isBlacklisted[account] = status;
        emit AddressBlacklisted(account, status);
    }

    function checkBlacklisted(address account) external view returns (bool) {
        return isBlacklisted[account];
    }
}
