import {buildModule} from '@nomicfoundation/hardhat-ignition/modules';

const AMOUNT = 300_000_000;

const MINTokenModule = buildModule('MINTokenModule', (m) => {
  const min = m.contract('MINToken', [AMOUNT]);

  return {min};
});

export default MINTokenModule;
