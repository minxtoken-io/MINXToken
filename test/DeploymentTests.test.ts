import {time, loadFixture, mine} from '@nomicfoundation/hardhat-toolbox/network-helpers';
import {anyValue} from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import {expect} from 'chai';
import {ethers, network} from 'hardhat';
import {MINStrategicSale, MINToken, MINToken__factory, MINVesting, MINVesting__factory,MINStrategicSale__factory} from '../typechain';
import {SignerWithAddress} from '@nomicfoundation/hardhat-ethers/signers';
import {VESTING_SCHEDULES, ALL_BENEFICIARIES} from '../tokenomics/new-tokenomics';
import {vesting} from '../typechain/contracts';
import {Decimal} from 'decimal.js';

let deployer: SignerWithAddress;
let minToken: MINToken;
let minTokenAddress: string;
let minVesting: MINVesting;
let minVestingAddress: string;
let minStrategic: MINStrategicSale;
let minStrategicAddress: string;

const impersonate = async (address: string) => {
  await network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [address],
  });

  await network.provider.send('hardhat_setBalance', [address, '0x100000000000000000000']);

  return ethers.provider.getSigner(address);
};

const timestampToDateString = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleString();
};

const printBlockchainTime=async()=>{
  const blockchainTimestamp = await time.latest();
  console.log('Datetime:', timestampToDateString(blockchainTimestamp));
}

describe('DeploymentTests', async function () {
  this.beforeAll('MINX token should be deployed', async function () {
    console.log('Deploying MINX token');
    deployer = await ethers.provider.getSigner(0);
    minToken = await new MINToken__factory(deployer).deploy(35_000_000);
    minTokenAddress = await minToken.getAddress();
    
  });
  describe('MINX Token', async function () {
    it('should have the correct name', async function () {
      expect(await minToken.name()).to.equal('Modern Innovation Network Token');
    });
    it('should have the correct symbol', async function () {
      expect(await minToken.symbol()).to.equal('MINX');
    });
    it('should have the correct decimals', async function () {
      expect(await minToken.decimals()).to.equal(18);
    });
    it('should have the correct total supply', async function () {
      expect(await minToken.totalSupply()).to.equal(35_000_000n * 10n ** 18n);
    });
    it('should send all the balance to the deployer', async function () {
      const balance = await minToken.balanceOf(deployer.address);
      expect(balance).to.equal(35_000_000n * 10n ** 18n);
    });
  });

  describe('MIN Vesting Schedules', async function () {
    this.beforeAll('MIN Vesting contract should be deployed', async function () {
      console.log('Deploying MIN Vesting contract');
      minVesting = await new MINVesting__factory(deployer).deploy(minTokenAddress);
      minVestingAddress = await minVesting.getAddress();
      const schedules = [
        VESTING_SCHEDULES.public,
        VESTING_SCHEDULES.operations,
        VESTING_SCHEDULES.devTeam,
        VESTING_SCHEDULES.reserve,
        VESTING_SCHEDULES.liquidity,
        VESTING_SCHEDULES.marketingAndRewards,
      ];

      for (const schedule of schedules) {
        await minToken.connect(deployer).transfer(minVestingAddress, schedule.totalAmount);
        await minVesting.addVestingSchedule(schedule);
      }
    });

    describe('MIN Strategic deployment', async function () {
      this.beforeAll('Strategic contract should be deployed', async function () {
        console.log('Deploying Strategic contract');
        minStrategic = await new MINStrategicSale__factory(deployer).deploy(minTokenAddress,
          {
            tgePermille: VESTING_SCHEDULES.strategic.tgePermille,
            beneficiary: '0x0000000000000000000000000000000000000000',
            cliffDuration: VESTING_SCHEDULES.strategic.cliffDuration,
            slicePeriodSeconds: VESTING_SCHEDULES.strategic.slicePeriodSeconds,
            startTimestamp: VESTING_SCHEDULES.strategic.startTimestamp,
            totalAmount: VESTING_SCHEDULES.strategic.totalAmount,
            vestingDuration: VESTING_SCHEDULES.strategic.vestingDuration,
            releasedAmount: VESTING_SCHEDULES.strategic.releasedAmount,
          }
        );
        minStrategicAddress = await minStrategic.getAddress();
        for (const beneficiary of ALL_BENEFICIARIES) {
          const decimalAmount = new Decimal(beneficiary.tokens);
          const multiplier = new Decimal(10).pow(18);
          const amount =  decimalAmount.mul(multiplier).toFixed();
          await minToken.connect(deployer).transfer(minStrategicAddress, BigInt(amount));
          await minStrategic.addBeneficiary(beneficiary.address, BigInt(amount));
        }
      });

      it('deployer should have zero balance', async function () {
        const balance = await minToken.balanceOf(deployer.address);
        expect(balance).to.equal(0n);
      });

    });
  });
});
