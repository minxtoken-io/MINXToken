import {time, loadFixture} from '@nomicfoundation/hardhat-toolbox/network-helpers';
import {anyValue} from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import {expect} from 'chai';
import {ethers, network} from 'hardhat';
import {MINVesting, MINVesting__factory, MINToken, MINToken__factory} from '../typechain';
import {MINStructs} from '../typechain/contracts/MINVesting';
import {SignerWithAddress} from '@nomicfoundation/hardhat-ethers/signers';
import {VESTING_SCHEDULES} from '../tokenomics/tokenomics';
let deployer: SignerWithAddress;
let nonOwner: SignerWithAddress;
let token: MINToken;
let vesting: MINVesting;
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
  // should be able to deploy
  beforeEach('should be deployed', async function () {
    deployer = await ethers.provider.getSigner(0);
    nonOwner = await ethers.provider.getSigner(1);

    token = await new MINToken__factory(deployer).deploy(300_000_000);
    vesting = await new MINVesting__factory(deployer).deploy(token);
    await token.connect(deployer).transfer(vesting, BigInt(300_000_000) * 10n ** 18n);
  });

  it('should not allow non-owner to setup', async function () {
    await expect(
      vesting.connect(nonOwner).setUpVestingSchedules([VESTING_SCHEDULES.strategic])
    ).revertedWithCustomError(vesting, 'OwnableUnauthorizedAccount');
  });

  it('should not allow setting a vesting schedule that needs more tokens than contract has', async function () {
    await expect(
      vesting.setUpVestingSchedules([
        {
          tgePermille: 100,
          beneficiary: deployer.address,
          startTimestamp: VESTING_SCHEDULES.strategic.startTimestamp,
          cliffDuration: 2 * MONTH,
          vestingDuration: 18 * MONTH,
          slicePeriodSeconds: MONTH,
          totalAmount: BigInt(300_000_001) * 10n ** 18n,
          releasedAmount: 0,
        },
      ])
    ).to.be.revertedWith('MINVesting: insufficient balance for vesting schedules');
  });

  beforeEach('should setup vesting schedules', async function () {
    await vesting.setUpVestingSchedules([
      VESTING_SCHEDULES.strategic,
      VESTING_SCHEDULES.private,
      VESTING_SCHEDULES.public,
      VESTING_SCHEDULES.enGaranti,
      VESTING_SCHEDULES.operations,
      VESTING_SCHEDULES.marketingAndRewards,
      VESTING_SCHEDULES.devTeam,
      VESTING_SCHEDULES.reserve,
      VESTING_SCHEDULES.liquidity,
    ]);
  });

  it('should not allow non-beneficiary to release tokens', async function () {
    const nonBeneficiary = await ethers.provider.getSigner(1);
    await expect(vesting.connect(nonBeneficiary).release(1)).to.be.revertedWith(
      'MINVesting: caller is not a beneficiary'
    );
  });

  it('should not allow release of tokens before cliff period', async function () {
    const beneficiary = await impersonate(VESTING_SCHEDULES.strategic.beneficiary);

    await expect(vesting.connect(beneficiary).release(1)).to.be.revertedWith('MINVesting: no tokens are due');
  });

  it('should correctly compute releasable amount', async function () {
    const strategic = VESTING_SCHEDULES.strategic;
    const beneficiary = await impersonate(VESTING_SCHEDULES.strategic.beneficiary);
    await time.increaseTo(strategic.startTimestamp + strategic.cliffDuration + MONTH);
    const releasableAmount = await vesting.computeReleasableAmount(beneficiary.address);
    const totalWithoutTge = strategic.totalAmount - (strategic.totalAmount * BigInt(strategic.tgePermille)) / 1000n;
    expect(releasableAmount).to.be.equal(totalWithoutTge / BigInt(strategic.vestingDuration / MONTH));
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
  });

  it('should return the vesting schedule of a beneficiary', async function () {
    //testing with private because it has no tge
    const beneficiary = await impersonate(VESTING_SCHEDULES.private.beneficiary);
    const schedule = await vesting.getVestingScheduleForBeneficiary(beneficiary.address);
    expect(schedule.beneficiary).to.be.equal(beneficiary);
  });
});
