import {HardhatUserConfig} from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import 'solidity-coverage';
import '@nomiclabs/hardhat-solhint';
import 'dotenv/config';

const MUMBAI_ACCOUNTS = process.env.MUMBAI_ACCOUNTS?.split(' ') || [];
const MUMBAI_RPC_URL = process.env.MUMBAI_RPC_URL || '';
const config: HardhatUserConfig = {
  solidity: '0.8.20',
};

export default config;
