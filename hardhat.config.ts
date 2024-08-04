import {HardhatUserConfig} from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import 'solidity-coverage';
import '@nomiclabs/hardhat-solhint';
import 'dotenv/config';
import 'solidity-docgen';
const POLYGON_ETHERSCAN_API_KEY = process.env.POLYGON_ETHERSCAN_API_KEY || '';
const POLYGON_AMOY_ACCOUNTS = process.env.POLYGON_AMOY_ACCOUNTS?.split(' ') || [];
const POLYGON_AMOY_RPC_URL = process.env.POLYGON_AMOY_RPC_URL || '';
const POLYGON_MAINNET_ACCOUNTS = process.env.POLYGON_MAINNET_ACCOUNTS?.split(' ') || [];
const POLYGON_MAINNET_RPC_URL = process.env.POLYGON_MAINNET_RPC_URL || '';

const config: HardhatUserConfig = {
  solidity: '0.8.20',
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v6',
  },
  networks: {
    hardhat: {
      gas: 15000000,
      gasPrice: 875000000,
      blockGasLimit: 15000000,
      allowUnlimitedContractSize: true,
      accounts: {},
    },
    polygonAmoy: {
      url: POLYGON_AMOY_RPC_URL,
      chainId: 80002,
      accounts: POLYGON_AMOY_ACCOUNTS,
    },
    polygonMainnet: {
      url: POLYGON_MAINNET_RPC_URL,
      chainId: 137,
      gas: "auto",
      accounts: POLYGON_MAINNET_ACCOUNTS,
    },
  },
  etherscan: {
    apiKey: {
      polygonAmoy: POLYGON_ETHERSCAN_API_KEY,
      polygonMainnet: POLYGON_ETHERSCAN_API_KEY,
    },
    customChains: [
      {
        network: 'polygonAmoy',
        chainId: 80002,
        urls: {
          apiURL: 'https://api-amoy.polygonscan.com/api',
          browserURL: 'https://amoy.polygonscan.com',
        },
      },
      {
        network: 'polygonMainnet',
        chainId: 137,
        urls: {
          apiURL: 'https://api.polygonscan.com/api',
          browserURL: 'https://polygonscan.com',
        },
      },
    ],
  },
};

export default config;
