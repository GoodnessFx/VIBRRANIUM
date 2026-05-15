require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-foundry");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "shanghai", // Support for transient storage opcodes if available
    },
  },
  networks: {
    hardhat: {
      forking: {
        url: process.env.ALCHEMY_ETHEREUM_RPC_URL || "",
        enabled: process.env.FORKING_ENABLED === "true",
      },
    },
  },
};
