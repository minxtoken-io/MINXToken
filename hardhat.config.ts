import {HardhatUserConfig} from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import 'solidity-coverage';
import '@nomiclabs/hardhat-solhint';
const config: HardhatUserConfig = {
  solidity: '0.8.20',
};

export default config;
