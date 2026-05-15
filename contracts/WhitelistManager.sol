// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title WhitelistManager
 * @dev Manages whitelisted addresses and contracts that are exempt from certain checks.
 */
contract WhitelistManager is AccessControl {
    bytes32 public constant WHITELISTER_ROLE = keccak256("WHITELISTER_ROLE");

    mapping(address => bool) public isWhitelisted;
    mapping(bytes32 => bool) public whitelistedPatterns;

    event AddressWhitelisted(address indexed account, bool status);
    event PatternWhitelisted(bytes32 indexed patternId, bool status);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(WHITELISTER_ROLE, admin);
    }

    function setAddressWhitelist(address account, bool status) external onlyRole(WHITELISTER_ROLE) {
        isWhitelisted[account] = status;
        emit AddressWhitelisted(account, status);
    }

    function setPatternWhitelist(bytes32 patternId, bool status) external onlyRole(WHITELISTER_ROLE) {
        whitelistedPatterns[patternId] = status;
        emit PatternWhitelisted(patternId, status);
    }

    function checkWhitelisted(address account) external view returns (bool) {
        return isWhitelisted[account];
    }
}
