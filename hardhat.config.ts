import {HardhatUserConfig} from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import 'solidity-coverage';
import '@nomiclabs/hardhat-solhint';
import 'dotenv/config';
import 'solidity-docgen';
const MUMBAI_ACCOUNTS = process.env.MUMBAI_ACCOUNTS?.split(' ') || [];
const MUMBAI_RPC_URL = process.env.MUMBAI_RPC_URL || '';
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
    mumbai: {
      url: MUMBAI_RPC_URL,
      chainId: 80001,
      accounts: MUMBAI_ACCOUNTS,
    },
  },
};

export default config;
