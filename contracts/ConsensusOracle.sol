// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ConsensusOracle
 * @dev Implements a 5-source price feed with median calculation and outlier detection.
 */
contract ConsensusOracle is AccessControl, Pausable {
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");

    address[5] public priceFeeds;
    mapping(address => uint256) public oracleReliability; // 0-100 score
    
    // Simplified price history for demonstration
    mapping(address => int256[]) public priceHistory;
    
    uint256 public constant DEVIATION_THRESHOLD = 20; // 20%
    uint256 public constant MIN_SOURCES = 3;

    event PriceUpdated(address indexed token, uint256 price, uint256 confidence);
    event OracleFlagged(address indexed oracle, string reason);

    constructor(address[5] memory _feeds, address admin) {
        priceFeeds = _feeds;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(UPDATER_ROLE, admin);
        
        for (uint256 i = 0; i < 5; i++) {
            oracleReliability[priceFeeds[i]] = 100;
        }
    }

    /**
     * @dev Calculates the median price from 5 sources.
     * Sorts prices and takes the middle value.
     */
    function getConsensusPrice(uint256[] memory prices) public pure returns (uint256 price, uint256 confidence) {
        require(prices.length >= MIN_SOURCES, "Insufficient sources");
        
        // Simple sort (bubble sort for small array)
        uint256 n = prices.length;
        for (uint256 i = 0; i < n - 1; i++) {
            for (uint256 j = 0; j < n - i - 1; j++) {
                if (prices[j] > prices[j + 1]) {
                    (prices[j], prices[j + 1]) = (prices[j + 1], prices[j]);
                }
            }
        }

        // Median
        price = prices[n / 2];
        
        // Confidence calculation based on deviation from median
        uint256 agreementCount = 0;
        for (uint256 i = 0; i < n; i++) {
            uint256 deviation = prices[i] > price ? (prices[i] - price) * 100 / price : (price - prices[i]) * 100 / price;
            if (deviation <= DEVIATION_THRESHOLD) {
                agreementCount++;
            }
        }
        
        confidence = (agreementCount * 100) / n;
        return (price, confidence);
    }

    function updateOracle(uint256 index, address newFeed) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(index < 5, "Invalid index");
        priceFeeds[index] = newFeed;
        oracleReliability[newFeed] = 100;
    }

    function isPriceManipulated(uint256 spotPrice, uint256 twapPrice) external pure returns (bool, uint256) {
        uint256 deviation = spotPrice > twapPrice ? (spotPrice - twapPrice) * 100 / twapPrice : (twapPrice - spotPrice) * 100 / twapPrice;
        return (deviation > DEVIATION_THRESHOLD, deviation);
    }
}
