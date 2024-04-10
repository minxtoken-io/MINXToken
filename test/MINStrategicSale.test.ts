import {time, loadFixture} from '@nomicfoundation/hardhat-toolbox/network-helpers';
import {anyValue} from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import {expect} from 'chai';
import {ethers, network} from 'hardhat';
import {
  MINToken,
  MINToken__factory,
  MINStrategicSale,
  MINStrategicSale__factory,
  MockToken,
  MockToken__factory,
} from '../typechain';
import {SignerWithAddress} from '@nomicfoundation/hardhat-ethers/signers';
import {VESTING_SCHEDULES} from '../tokenomics/tokenomics';
let deployer: SignerWithAddress;
let min: MockToken;
let anyone: SignerWithAddress;
let minStrategicSale: MINStrategicSale;
const AMOUNT = 300_000_000;
const DECIMALS = 18;
require('events').EventEmitter.defaultMaxListeners = 512;
describe('MINStrategicSale', function () {
  beforeEach(async function () {
    await network.provider.request({
      method: 'hardhat_reset',
      params: [],
    });
  });
  beforeEach('should be deployed', async function () {
    deployer = await ethers.provider.getSigner(0);
    anyone = await ethers.provider.getSigner(1);

    min = await new MockToken__factory(deployer).deploy(BigInt(AMOUNT));
    const schedule = VESTING_SCHEDULES.strategic;
    minStrategicSale = await new MINStrategicSale__factory(deployer).deploy(min, {
      tgePermille: schedule.tgePermille,
      beneficiary: '0x0000000000000000000000000000000000000000',
      cliffDuration: schedule.cliffDuration,
      slicePeriodSeconds: schedule.slicePeriodSeconds,
      startTimestamp: schedule.startTimestamp,
      totalAmount: schedule.totalAmount,
      vestingDuration: schedule.vestingDuration,
      releasedAmount: schedule.releasedAmount,
    });
  });

  it('should allow owner to add beneficiaries', async function () {
    await min.connect(deployer).transfer(minStrategicSale, 1000n * 10n ** 18n);
    await expect(minStrategicSale.connect(deployer).addBeneficiary(anyone, 1000n * 10n ** 18n)).to.not.be.reverted;
  });

  it('should not allow owner to add the same beneficiary more than once', async function () {
    await min.connect(deployer).transfer(minStrategicSale, 2000n * 10n ** 18n);
    await expect(minStrategicSale.connect(deployer).addBeneficiary(anyone, 1000n * 10n ** 18n)).to.not.be.reverted;
    await expect(minStrategicSale.connect(deployer).addBeneficiary(anyone, 1000n * 10n ** 18n)).to.be.revertedWith(
      'MINStrategicSale: beneficiary already exists'
    );
  });

  it('should not allow owner to add a beneficary with 0 amount', async function () {
    await min.connect(deployer).transfer(minStrategicSale, 2000n * 10n ** 18n);
    await expect(minStrategicSale.connect(deployer).addBeneficiary(anyone, 0)).to.be.revertedWith(
      'MINStrategicSale: amount must be greater than 0'
    );
  });

  it('shouldot allow owner to add a beneficiary with 0 address', async function () {
    await min.connect(deployer).transfer(minStrategicSale, 2000n * 10n ** 18n);
    await expect(
      minStrategicSale.connect(deployer).addBeneficiary('0x' + '0'.repeat(40), 1000n * 10n ** 18n)
    ).to.be.revertedWith('MINStrategicSale: beneficiary address cannot be 0');
  });

  it('should not allow owner to add a beneficary with more amount than contract', async function () {
    await min.connect(deployer).transfer(minStrategicSale, 2000n * 10n ** 18n);
    await expect(minStrategicSale.connect(deployer).addBeneficiary(anyone, 2001n * 10n ** 18n)).to.be.revertedWith(
      'MINStrategicSale: amount must be less than or equal to contract balance'
    );
  });

  it('should not allow non-owner to add beneficiaries', async function () {
    await expect(
      minStrategicSale.connect(anyone).addBeneficiary(anyone, 1000n * 10n ** 18n)
    ).to.be.revertedWithCustomError(minStrategicSale, 'OwnableUnauthorizedAccount');
  });

  it('should calculate withdrawable mintoken amount correctly', async function () {
    await min.connect(deployer).transfer(minStrategicSale, 2000n * 10n ** 18n);
    expect(await minStrategicSale.connect(anyone).computeWithdrawableMintokens()).to.be.equal(2000n * 10n ** 18n);
    await expect(minStrategicSale.connect(deployer).addBeneficiary(anyone, 1000n * 10n ** 18n)).to.not.be.reverted;
    expect(await minStrategicSale.connect(anyone).computeWithdrawableMintokens()).to.be.equal(1000n * 10n ** 18n);
  });

  it('should allow owner to withdraw non-vested tokens', async function () {
    await min.connect(deployer).transfer(minStrategicSale, 2000n * 10n ** 18n);
    await expect(minStrategicSale.connect(deployer).withdrawMinTokens(2000n * 10n ** 18n)).to.not.be.reverted;
  });

  it('should revert withdrawal of mintokens if transfer fails', async function () {
    await min.connect(deployer).transfer(minStrategicSale, 2000n * 10n ** 18n);
    await min.setToFailTransfer(true);
    await expect(minStrategicSale.connect(deployer).withdrawMinTokens(2000n * 10n ** 18n)).to.be.reverted;
  });

  it('should not allow owner to withdraw more than non-vested tokens', async function () {
    await min.connect(deployer).transfer(minStrategicSale, 2000n * 10n ** 18n);
    await expect(minStrategicSale.connect(deployer).withdrawMinTokens(3000n * 10n ** 18n)).to.be.revertedWith(
      "MINStrategicSale: cannot withdraw more than beneficiary's total amount"
    );
  });

  it('should not allow anybody other than owner to withdraw non-vested tokens', async function () {
    await min.connect(deployer).transfer(minStrategicSale, 2000n * 10n ** 18n);
    await expect(minStrategicSale.connect(anyone).withdrawMinTokens(10n * 10n ** 18n)).to.be.revertedWithCustomError(
      minStrategicSale,
      'OwnableUnauthorizedAccount'
    );
  });

  it('should not calculate releasable amount for any non-beneficiary', async function () {
    await expect(minStrategicSale.connect(anyone).computeReleasableAmount(anyone)).to.be.revertedWith(
      'MINVesting: beneficiary not found'
    );
  });

  it('should calculate releasable amount correctly', async function () {
    await min.connect(deployer).transfer(minStrategicSale, 2000n * 10n ** 18n);
    await expect(minStrategicSale.connect(deployer).addBeneficiary(anyone, 1000n * 10n ** 18n)).to.not.be.reverted;
    const releasableAmount = await minStrategicSale.computeReleasableAmount(anyone);
    expect(releasableAmount).to.be.equal((1000n * 10n ** 18n) / 10n);

    const testStart = await time.latest();
    const strategicSaleWith0Tge = await new MINStrategicSale__factory(deployer).deploy(min, {
      tgePermille: 0,
      beneficiary: '0x0000000000000000000000000000000000000000',
      cliffDuration: 600,
      slicePeriodSeconds: 120,
      vestingDuration: 120 * 10,
      startTimestamp: testStart,
      totalAmount: VESTING_SCHEDULES.strategic.totalAmount,
      releasedAmount: VESTING_SCHEDULES.strategic.releasedAmount,
    });
    await min.connect(deployer).transfer(strategicSaleWith0Tge, 2000n * 10n ** 18n);
    await expect(strategicSaleWith0Tge.connect(deployer).addBeneficiary(anyone, 1000n * 10n ** 18n)).to.not.be.reverted;
    const releasableAmountWith0Tge = await strategicSaleWith0Tge.computeReleasableAmount(anyone);
    expect(releasableAmountWith0Tge).to.be.equal(0);
    await time.increase(720);
    const releasableAmountWith0TgeAfterCliff = await strategicSaleWith0Tge.computeReleasableAmount(anyone);
    expect(releasableAmountWith0TgeAfterCliff).to.be.equal((1000n * 10n ** 18n) / 10n);
  });
});
