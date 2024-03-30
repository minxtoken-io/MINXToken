import {time, loadFixture} from '@nomicfoundation/hardhat-toolbox/network-helpers';
import {ethers} from 'hardhat';
import {MINVesting, MINVesting__factory, MINToken, MINToken__factory} from '../typechain';
import {MINStructs} from '../typechain/contracts/MINVesting';
import {SignerWithAddress} from '@nomicfoundation/hardhat-ethers/signers';

let deployer: SignerWithAddress;
let token: MINToken;
let vesting: MINVesting;
let vestingSchedule: MINStructs.VestingScheduleStruct;
const MONTH = 60 * 60 * 24 * 30;
describe('MINVesting', function () {
  // should be able to deploy
  beforeEach('should be deployed', async function () {
    deployer = await ethers.provider.getSigner(0);
    vestingSchedule = {
      tgePermille: 500,
      beneficiary: deployer.address,
      startTimestamp: (Date.now() / 1000).toFixed(0), // 30 seconds from now
      cliffDuration: MONTH,
      vestingDuration: MONTH * 16, // 12 minutes
      slicePeriodSeconds: MONTH, // minute
      totalAmount: BigInt(1_000_000) * 10n ** 18n,
      releasedAmount: 0,
    };
    token = await new MINToken__factory(deployer).deploy(1_000_000);
    vesting = await new MINVesting__factory(deployer).deploy(token);
    await token.connect(deployer).transfer(vesting, BigInt(1_000_000) * 10n ** 18n);
    await vesting.setUpVestingSchedules([vestingSchedule]);
  });
});
