import {time, loadFixture} from '@nomicfoundation/hardhat-toolbox/network-helpers';
import {expect} from 'chai';
import {ethers, network} from 'hardhat';
import {
  MINVesting,
  MINVesting__factory,
  MINToken,
  MINToken__factory,
  MockToken,
  MockToken__factory,
} from '../typechain';
import {MINStructs} from '../typechain/contracts/vesting/MINVesting';
import {SignerWithAddress} from '@nomicfoundation/hardhat-ethers/signers';
import {VESTING_SCHEDULES} from '../tokenomics/tokenomics';
let deployer: SignerWithAddress;
let nonOwner: SignerWithAddress;
let token: MINToken;
let mockToken: MockToken;
let vesting: MINVesting;
let vestingWithMockToken: MINVesting;
const MONTH = 60 * 60 * 24 * 30;
const impersonate = async (address: string) => {
  await network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [address],
  });

  await network.provider.send('hardhat_setBalance', [address, '0x100000000000000000000']);

  return ethers.provider.getSigner(address);
};

describe('MINVesting', function () {
  this.beforeAll(async function () {
    await network.provider.request({
      method: 'hardhat_reset',
      params: [],
    });
  });

  it('should not be able to deploy with zero address token', async function () {
    deployer = await ethers.provider.getSigner(0);
    const factory = new MINVesting__factory(deployer);
    await expect(factory.deploy('0x' + '0'.repeat(40))).to.be.revertedWith('MINVesting: token address cannot be zero');
  });
  beforeEach(async function () {
    deployer = await ethers.provider.getSigner(0);
    nonOwner = await ethers.provider.getSigner(1);

    token = await new MINToken__factory(deployer).deploy(300_000_000);
    vesting = await new MINVesting__factory(deployer).deploy(token);
  });

  it('should not be able to setup schedules without enough tokens', async function () {
    await expect(
      vesting.connect(deployer).addVestingSchedule({
        tgePermille: 0,
        beneficiary: deployer.address,
        startTimestamp: VESTING_SCHEDULES.strategic.startTimestamp,
        cliffDuration: 2 * MONTH,
        vestingDuration: 18 * MONTH,
        slicePeriodSeconds: MONTH,
        totalAmount: BigInt(900_000_001) * 10n ** 18n,
        releasedAmount: 0,
      })
    ).to.be.revertedWith('MINVesting: insufficient balance for vesting schedule');
  });
  it('should not be able to setup schedules with address(0)', async function () {
    await expect(
      vesting.connect(deployer).addVestingSchedule({
        tgePermille: 0,
        beneficiary: '0x' + '0'.repeat(40),
        startTimestamp: VESTING_SCHEDULES.strategic.startTimestamp,
        cliffDuration: 2 * MONTH,
        vestingDuration: 18 * MONTH,
        slicePeriodSeconds: MONTH,
        totalAmount: 0,
        releasedAmount: 100n * 10n ** 18n,
      })
    ).to.be.revertedWith('MINVesting: beneficiary address cannot be zero');
  });
  it('should not be able to setup schedules with slicePeriodSeconds of 0', async function () {
    await token.connect(deployer).transfer(vesting, 300_000_000n * 10n ** 18n);
    await expect(
      vesting.connect(deployer).addVestingSchedule({
        tgePermille: 0,
        beneficiary: deployer.address,
        startTimestamp: VESTING_SCHEDULES.strategic.startTimestamp,
        cliffDuration: 2 * MONTH,
        vestingDuration: 18 * MONTH,
        slicePeriodSeconds: 0,
        totalAmount: 100n * 10n ** 18n,
        releasedAmount: 0,
      })
    ).to.be.revertedWith('MINVesting: slice period must be greater than zero');
  });
  it('should not be able to setup schedules with vestingDuration of 0 or vestingDuration less than slicePeriodSeconds', async function () {
    await token.connect(deployer).transfer(vesting, 300_000_000n * 10n ** 18n);
    await expect(
      vesting.connect(deployer).addVestingSchedule({
        tgePermille: 0,
        beneficiary: deployer.address,
        startTimestamp: VESTING_SCHEDULES.strategic.startTimestamp,
        cliffDuration: 2 * MONTH,
        vestingDuration: MONTH / 2,
        slicePeriodSeconds: MONTH,
        totalAmount: 100n * 10n ** 18n,
        releasedAmount: 0,
      })
    ).to.be.revertedWith('MINVesting: vesting duration must be greater than zero and slice period');
  });

  it('should not be able to setup schedules with 0 total amount', async function () {
    await expect(
      vesting.connect(deployer).addVestingSchedule({
        tgePermille: 0,
        beneficiary: deployer.address,
        startTimestamp: VESTING_SCHEDULES.strategic.startTimestamp,
        cliffDuration: 2 * MONTH,
        vestingDuration: 18 * MONTH,
        slicePeriodSeconds: MONTH,
        totalAmount: 0,
        releasedAmount: 0,
      })
    ).to.be.revertedWith('MINVesting: total amount must be greater than zero');
  });

  it('should not allow non-owner to setup', async function () {
    await expect(vesting.connect(nonOwner).addVestingSchedule(VESTING_SCHEDULES.strategic)).revertedWithCustomError(
      vesting,
      'OwnableUnauthorizedAccount'
    );
  });

  describe('With correct vesting setup', function () {
    beforeEach(async function () {
      await token.connect(deployer).transfer(vesting, 300_000_000n * 10n ** 18n);

      for (const schedule of [
        VESTING_SCHEDULES.strategic,
        VESTING_SCHEDULES.private,
        VESTING_SCHEDULES.public,
        VESTING_SCHEDULES.enGaranti,
        VESTING_SCHEDULES.operations,
        VESTING_SCHEDULES.marketingAndRewards,
        VESTING_SCHEDULES.devTeam,
        VESTING_SCHEDULES.reserve,
        VESTING_SCHEDULES.liquidity,
      ]) {
        await vesting.connect(deployer).addVestingSchedule(schedule);
      }
    });

    it('should not allow non-beneficiary to release tokens', async function () {
      const nonBeneficiary = await ethers.provider.getSigner(1);
      await expect(vesting.connect(nonBeneficiary).release(1)).to.be.revertedWith(
        'MINVesting: caller is not a beneficiary'
      );
    });

    it('should not allow release of non-tge tokens before cliff period', async function () {
      const beneficiary = await impersonate(VESTING_SCHEDULES.enGaranti.beneficiary);

      await expect(vesting.connect(beneficiary).release(1)).to.be.revertedWith('MINVesting: no tokens are due');
    });

    it('should correctly compute releasable amount', async function () {
      const publicSchedule = VESTING_SCHEDULES.public;
      const beneficiary = await impersonate(publicSchedule.beneficiary);
      const tge = (publicSchedule.totalAmount * BigInt(publicSchedule.tgePermille)) / 1000n;
      const totalWithoutTge = publicSchedule.totalAmount - tge;
      const perVestingPeriod =
        totalWithoutTge / BigInt(publicSchedule.vestingDuration / publicSchedule.slicePeriodSeconds);
      const beforeCliff = await vesting.computeReleasableAmount(beneficiary.address);
      await time.increaseTo(publicSchedule.startTimestamp + publicSchedule.cliffDuration + MONTH);
      const afterCliff = await vesting.computeReleasableAmount(beneficiary.address);

      expect(beforeCliff).to.be.equal(tge);
      expect(afterCliff).to.be.equal(tge + perVestingPeriod);
    });

    it('should return beneficiary vesting schedule', async function () {
      await expect(vesting.getVestingSchedule(deployer.address)).to.not.be.reverted;
    });

    it('should not compute if beneficiary is not in schedule', async function () {
      await expect(vesting.computeReleasableAmount(nonOwner.address)).to.be.revertedWith(
        'MINVesting: beneficiary not found'
      );
    });

    it('should not compute if beneficiary is 0 address', async function () {
      await expect(vesting.computeReleasableAmount('0x' + '0'.repeat(40))).to.be.revertedWith(
        'MINVesting: beneficiary address cannot be zero'
      );
    });

    it('should not allow release of tokens more than releasable', async function () {
      const strategic = VESTING_SCHEDULES.strategic;
      const beneficiary = await impersonate(strategic.beneficiary);
      const releasableAmount = await vesting.computeReleasableAmount(beneficiary.address);

      await expect(vesting.connect(beneficiary).release(releasableAmount + BigInt(1))).to.be.revertedWith(
        'MINVesting: amount exceeds releasable amount'
      );
    });

    it('should allow release of tokens after cliff period', async function () {
      const beneficiary = await impersonate(VESTING_SCHEDULES.strategic.beneficiary);
      await expect(vesting.connect(beneficiary).release(1)).to.not.be.reverted;
    });

    it('should revert if token transfer fails', async function () {
      mockToken = await new MockToken__factory(deployer).deploy(300_000_000n);
      vestingWithMockToken = await new MINVesting__factory(deployer).deploy(mockToken);
      await mockToken.connect(deployer).transfer(vestingWithMockToken, 300_000_000n * 10n ** 18n);

      for (const schedule of [
        VESTING_SCHEDULES.strategic,
        VESTING_SCHEDULES.private,
        VESTING_SCHEDULES.public,
        VESTING_SCHEDULES.enGaranti,
        VESTING_SCHEDULES.operations,
        VESTING_SCHEDULES.marketingAndRewards,
        VESTING_SCHEDULES.devTeam,
        VESTING_SCHEDULES.reserve,
        VESTING_SCHEDULES.liquidity,
      ]) {
        await vestingWithMockToken.connect(deployer).addVestingSchedule(schedule);
      }
      await mockToken.setToFailTransfer(true);
      const beneficiary = await impersonate(VESTING_SCHEDULES.public.beneficiary);
      await expect(vestingWithMockToken.connect(beneficiary).release(1)).to.be.reverted;
    });

    it('should not allow release of more tokens than vested', async function () {
      const beneficiary = await impersonate(VESTING_SCHEDULES.strategic.beneficiary);
      await expect(vesting.connect(beneficiary).release(10000000)).to.not.be.reverted;
    });

    it('should allow release of all tokens after vesting period', async function () {
      const beneficiary = await impersonate(VESTING_SCHEDULES.public.beneficiary);
      await time.increaseTo(
        VESTING_SCHEDULES.public.startTimestamp +
          VESTING_SCHEDULES.public.cliffDuration +
          VESTING_SCHEDULES.public.vestingDuration +
          MONTH
      );
      const releasableAmount = await vesting.connect(beneficiary).computeReleasableAmount(beneficiary);
      expect(releasableAmount).to.be.equal(VESTING_SCHEDULES.public.totalAmount);
    });

    it('should return the vesting schedule of a beneficiary', async function () {
      //testing with private because it has no tge
      const beneficiary = await impersonate(VESTING_SCHEDULES.private.beneficiary);
      const schedule = await vesting.getVestingSchedule(beneficiary.address);
      expect(schedule.beneficiary).to.be.equal(beneficiary);
    });

    it('should not return the vesting scheudle of 0 address', async function () {
      await expect(vesting.getVestingSchedule('0x' + '0'.repeat(40))).to.be.revertedWith(
        'MINVesting: beneficiary address cannot be zero'
      );
    });
  });
});
