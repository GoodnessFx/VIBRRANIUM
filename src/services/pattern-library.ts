/**
 * @title PatternLibrary
 * @dev Database of known attack patterns and legitimate activity signatures.
 */
export const ATTACK_PATTERNS = {
  REENTRANCY: {
    id: "REENTRANCY_001",
    name: "Standard Reentrancy",
    selectors: ["0x2e1a7d4d", "0x3ccfd60b"], // withdraw, withdrawAll
    minCallDepth: 3,
  },
  FLASH_LOAN: {
    id: "FLASH_LOAN_001",
    name: "Flash Loan Exploit",
    providers: [
      "0xabdecd73", // Aave V2
      "0x5c19a951", // Aave V3
      "0xba122222", // Balancer V2
      "0x7a250d56", // Uniswap V2
    ],
  },
  ORACLE_MANIPULATION: {
    id: "ORACLE_001",
    name: "Price Manipulation",
    signals: ["latestRoundData", "getPrice", "consult", "spotPrice"],
  },
  ACCESS_CONTROL: {
    id: "ACCESS_001",
    name: "Unauthorized Access",
    selectors: [
      "0xf2fde38b", // transferOwnership
      "0x3659cfe6", // upgradeTo
      "0x4f1ef286", // upgradeToAndCall
    ],
  }
};

export const LEGITIMATE_PATTERNS = {
  MEV_BOTS: [
    "0x000000000035b0334c4424354b334c4424354b33", // Example MEV bot
  ],
  LIQUIDATION_BOTS: [
    "0x6b175474e89094c44da98b954eedeac495271d0f", // Example Liquidator
  ],
  PROTOCOL_MAINTENANCE: [
    "0x", // Maintenance addresses
  ]
};
