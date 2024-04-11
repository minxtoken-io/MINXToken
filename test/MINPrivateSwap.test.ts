import {time, loadFixture} from '@nomicfoundation/hardhat-toolbox/network-helpers';
import {anyValue} from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import {expect} from 'chai';
import {ethers, network} from 'hardhat';
import {
  MINToken,
  MINToken__factory,
  MINPrivateSwap,
  MINPrivateSwap__factory,
  MockToken,
  MockToken__factory,
} from '../typechain';
import {SignerWithAddress} from '@nomicfoundation/hardhat-ethers/signers';
import {VESTING_SCHEDULES} from '../tokenomics/tokenomics';

let deployer: SignerWithAddress;
let anyone: SignerWithAddress;
let min: MockToken;
let swapToken: MockToken;
let minPrivateSwap: MINPrivateSwap;
const AMOUNT = 300_000_000;
const DECIMALS = 18;
require('events').EventEmitter.defaultMaxListeners = 512;
describe('MINPrivateSwap', function () {
  // should be able to deploy
  beforeEach(async function () {
    await network.provider.request({
      method: 'hardhat_reset',
      params: [],
    });
  });

  it('should not be able to deploy with 0 adress swap token', async function () {
    deployer = await ethers.provider.getSigner(0);
    anyone = await ethers.provider.getSigner(1);

    min = await new MockToken__factory(deployer).deploy(AMOUNT);
    const schedule = VESTING_SCHEDULES.private;
    const saleDuration = 300;
    const factory = await new MINPrivateSwap__factory(deployer);

    await expect(
      factory.deploy(
        min,
        '0x' + '0'.repeat(40),
        30,
        1500000n * 10n ** 18n,
        {
          tgePermille: schedule.tgePermille,
          beneficiary: '0x0000000000000000000000000000000000000000',
          cliffDuration: schedule.cliffDuration,
          slicePeriodSeconds: schedule.slicePeriodSeconds,
          startTimestamp: schedule.startTimestamp,
          totalAmount: schedule.totalAmount,
          vestingDuration: schedule.vestingDuration,
          releasedAmount: schedule.releasedAmount,
        },
        saleDuration
      )
    ).to.be.revertedWith('MINPrivateSwap: swap token address cannot be 0');
  });

  it("should not deploy if sale doesn't end before vesting starts", async function () {
    deployer = await ethers.provider.getSigner(0);

    min = await new MockToken__factory(deployer).deploy(AMOUNT);
    swapToken = await new MockToken__factory(deployer).deploy(AMOUNT);
    const schedule = VESTING_SCHEDULES.private;
    const saleDuration = Math.floor((schedule.startTimestamp - Math.floor(Date.now() / 1000)) * 2);
    const factory = await new MINPrivateSwap__factory(deployer);
    await expect(
      factory.deploy(
        min,
        swapToken,
        30,
        1500000n * 10n ** 18n,
        {
          tgePermille: schedule.tgePermille,
          beneficiary: '0x0000000000000000000000000000000000000000',
          cliffDuration: schedule.cliffDuration,
          slicePeriodSeconds: schedule.slicePeriodSeconds,
          startTimestamp: schedule.startTimestamp,
          totalAmount: schedule.totalAmount,
          vestingDuration: schedule.vestingDuration,
          releasedAmount: schedule.releasedAmount,
        },
        saleDuration
      )
    ).to.be.revertedWith('MINPrivateSwap: sale must end before cliff and vesting starts');
  });

  beforeEach('should be deployed', async function () {
    deployer = await ethers.provider.getSigner(0);
    anyone = await ethers.provider.getSigner(1);

    min = await new MockToken__factory(deployer).deploy(AMOUNT);
    swapToken = await new MockToken__factory(deployer).deploy(AMOUNT);
    const schedule = VESTING_SCHEDULES.private;
    const saleDuration = 300;
    minPrivateSwap = await new MINPrivateSwap__factory(deployer).deploy(
      min,
      swapToken,
      30,
      1500000n * 10n ** 18n,
      {
        tgePermille: schedule.tgePermille,
        beneficiary: '0x0000000000000000000000000000000000000000',
        cliffDuration: schedule.cliffDuration,
        slicePeriodSeconds: schedule.slicePeriodSeconds,
        startTimestamp: schedule.startTimestamp,
        totalAmount: schedule.totalAmount,
        vestingDuration: schedule.vestingDuration,
        releasedAmount: schedule.releasedAmount,
      },
      saleDuration
    );

    await min.connect(deployer).transfer(minPrivateSwap, 1500000n * 10n ** 18n);
  });

  it('should be able to let users deposit swap token', async function () {
    const swapTokenAmount = BigInt(10) * 10n ** BigInt(DECIMALS);
    await swapToken.connect(deployer).approve(minPrivateSwap, swapTokenAmount);
    await minPrivateSwap.connect(deployer).deposit(swapTokenAmount);
    expect(await swapToken.balanceOf(minPrivateSwap)).to.equal(swapTokenAmount);
  });

  it('should not be able to let users deposit swap token if not approved', async function () {
    const swapTokenAmount = BigInt(1) * 10n ** BigInt(DECIMALS);
    await expect(minPrivateSwap.connect(deployer).deposit(swapTokenAmount)).to.be.revertedWithCustomError(
      swapToken,
      'ERC20InsufficientAllowance'
    );
  });

  it('should not be able to let users deposit more value than what contract can release', async function () {
    const swapTokenAmount = BigInt(450001) * 10n ** BigInt(DECIMALS);
    await swapToken.connect(deployer).approve(minPrivateSwap, swapTokenAmount);
    await expect(minPrivateSwap.connect(deployer).deposit(swapTokenAmount)).to.be.revertedWith(
      'MINPrivateSwap: not enough MIN tokens to buy for the swap tokens'
    );
  });

  it('should be able to let users only deposit amounts over 0', async function () {
    const swapTokenAmount = BigInt(0) * 10n ** BigInt(DECIMALS);
    await swapToken.connect(deployer).approve(minPrivateSwap, swapTokenAmount);
    await expect(minPrivateSwap.connect(deployer).deposit(swapTokenAmount)).to.be.revertedWith(
      'MINPrivateSwap: amount must be greater than 0'
    );
  });

  it('should not add the same user to beneficiary list more than once', async function () {
    const swapTokenAmount = BigInt(10) * 10n ** BigInt(DECIMALS);
    await swapToken.connect(deployer).approve(minPrivateSwap, swapTokenAmount);
    await minPrivateSwap.connect(deployer).deposit(swapTokenAmount);
    await minPrivateSwap.connect(deployer).withdraw(swapTokenAmount);
    await swapToken.connect(deployer).approve(minPrivateSwap, swapTokenAmount);

    await expect(minPrivateSwap.connect(deployer).deposit(swapTokenAmount)).to.not.be.reverted;
  });

  it('should not let users deposit after sale ends', async function () {
    await time.increase(300);
    const swapTokenAmount = BigInt(10) * 10n ** BigInt(DECIMALS);
    await swapToken.connect(deployer).approve(minPrivateSwap, swapTokenAmount);
    await expect(minPrivateSwap.connect(deployer).deposit(swapTokenAmount)).to.be.revertedWith(
      'MINPrivateSwap: sale has ended'
    );
  });

  it('should not let users withdraw more than they deposit', async function () {
    const swapTokenAmount = BigInt(10) * 10n ** BigInt(DECIMALS);
    await swapToken.connect(deployer).approve(minPrivateSwap, swapTokenAmount);
    await minPrivateSwap.connect(deployer).deposit(swapTokenAmount);
    await expect(minPrivateSwap.connect(deployer).withdraw(swapTokenAmount * 2n)).to.be.revertedWith(
      'MINPrivateSwap: insufficient balance'
    );
  });

  it('should not let users withdraw after sale ends', async function () {
    const swapTokenAmount = BigInt(10) * 10n ** BigInt(DECIMALS);
    await swapToken.connect(deployer).approve(minPrivateSwap, swapTokenAmount);
    await minPrivateSwap.connect(deployer).deposit(swapTokenAmount);
    await time.increase(300);
    await expect(minPrivateSwap.connect(deployer).withdraw(swapTokenAmount)).to.be.revertedWith(
      'MINPrivateSwap: sale has ended'
    );
  });

  it('should revert if withdraw transfer fails', async function () {
    const swapTokenAmount = BigInt(10) * 10n ** BigInt(DECIMALS);
    await swapToken.connect(deployer).approve(minPrivateSwap, swapTokenAmount);
    await minPrivateSwap.connect(deployer).deposit(swapTokenAmount);
    await swapToken.connect(deployer).setToFailTransfer(true);
    await expect(minPrivateSwap.connect(deployer).withdraw(swapTokenAmount)).to.be.reverted;
  });

  it('should calculate withdrawable minToken amount as zero before sale ends', async function () {
    const withdrawableAmount = await minPrivateSwap.connect(deployer).calculateWithdrawableMinToken();
    expect(withdrawableAmount).to.equal(0);
  });

  it('should be able to let deployer to withdraw swap tokens if mintokens are loaded after sale end', async function () {
    const swapTokenAmount = BigInt(10) * 10n ** BigInt(DECIMALS);
    await swapToken.connect(deployer).approve(minPrivateSwap, swapTokenAmount);
    await minPrivateSwap.connect(deployer).deposit(swapTokenAmount);
    await time.increase(300);
    await min.connect(deployer).transfer(minPrivateSwap, swapTokenAmount * 100n);
    await expect(minPrivateSwap.connect(deployer).withdrawSwapToken(swapTokenAmount)).to.not.be.reverted;
  });

  it('should not let anyone other than deployer to withdraw swap tokens if mintokens are loaded after sale end', async function () {
    const swapTokenAmount = BigInt(10) * 10n ** BigInt(DECIMALS);
    await swapToken.connect(deployer).approve(minPrivateSwap, swapTokenAmount);
    await minPrivateSwap.connect(deployer).deposit(swapTokenAmount);
    await time.increase(300);
    await expect(minPrivateSwap.connect(anyone).withdrawSwapToken(swapTokenAmount)).to.be.revertedWithCustomError(
      minPrivateSwap,
      'OwnableUnauthorizedAccount'
    );
  });

  it('should not create vesting schedule if beneficiary has no deposits at the end of the sale', async function () {
    const swapTokenAmount = BigInt(10) * 10n ** BigInt(DECIMALS);
    await swapToken.connect(deployer).approve(minPrivateSwap, swapTokenAmount);
    await minPrivateSwap.connect(deployer).deposit(swapTokenAmount);
    await minPrivateSwap.connect(deployer).withdraw(swapTokenAmount);
    await swapToken.connect(deployer).transfer(anyone, swapTokenAmount);
    await swapToken.connect(anyone).transfer(minPrivateSwap, swapTokenAmount);
    await min.connect(deployer).transfer(minPrivateSwap, swapTokenAmount * 100n);
    await time.increase(300);
    await minPrivateSwap.connect(deployer).withdrawSwapToken(swapTokenAmount);

    const schedule = await minPrivateSwap.getVestingSchedule(deployer);
    expect(schedule.beneficiary).to.equal('0x' + '0'.repeat(40));
  });

  it('should not let deployer to withdraw swap tokens before sale end', async function () {
    const swapTokenAmount = BigInt(10) * 10n ** BigInt(DECIMALS);
    await swapToken.connect(deployer).approve(minPrivateSwap, swapTokenAmount);
    await minPrivateSwap.connect(deployer).deposit(swapTokenAmount);
    await expect(minPrivateSwap.connect(deployer).withdrawSwapToken(swapTokenAmount)).to.be.revertedWith(
      'MINPrivateSwap: sale is still ongoing'
    );
  });

  it('should not let deployer to withdraw more swap tokens than contract has', async function () {
    await time.increase(300);
    const contractBalance = await min.balanceOf(minPrivateSwap);
    await expect(minPrivateSwap.connect(deployer).withdrawSwapToken(1n * 10n ** 18n)).to.be.revertedWith(
      'MINPrivateSwap: Insufficient balance'
    );
  });

  it('should revert withdrawal of swap tokens if transfer fails', async function () {
    const swapTokenAmount = BigInt(10) * 10n ** BigInt(DECIMALS);
    await swapToken.connect(deployer).approve(minPrivateSwap, swapTokenAmount);
    await minPrivateSwap.connect(deployer).deposit(swapTokenAmount);
    await time.increase(300);
    await min.connect(deployer).transfer(minPrivateSwap, swapTokenAmount * 100n);
    await swapToken.connect(deployer).setToFailTransfer(true);
    await expect(minPrivateSwap.connect(deployer).withdrawSwapToken(swapTokenAmount)).to.be.reverted;
  });

  it('should let deployer withdraw any unsold mintokens', async function () {
    const swapTokenAmount = BigInt(10) * 10n ** BigInt(DECIMALS);
    await swapToken.connect(deployer).approve(minPrivateSwap, swapTokenAmount);
    await minPrivateSwap.connect(deployer).deposit(swapTokenAmount);
    await time.increase(300);
    await min.connect(deployer).transfer(minPrivateSwap, swapTokenAmount * 100n);
    await expect(minPrivateSwap.connect(deployer).withdrawMinToken(100)).to.not.be.reverted;
  });

  it('should not let anyone other than deployer withdraw any unsold mintokens', async function () {
    const swapTokenAmount = BigInt(10) * 10n ** BigInt(DECIMALS);
    await swapToken.connect(deployer).approve(minPrivateSwap, swapTokenAmount);
    await minPrivateSwap.connect(deployer).deposit(swapTokenAmount);
    await time.increase(300);
    await min.connect(deployer).transfer(minPrivateSwap, swapTokenAmount * 100n);
    await expect(minPrivateSwap.connect(anyone).withdrawMinToken(100)).to.be.revertedWithCustomError(
      minPrivateSwap,
      'OwnableUnauthorizedAccount'
    );
  });

  it('should not let deployer withdraw any unsold mintokens before sale end', async function () {
    await expect(minPrivateSwap.connect(deployer).withdrawMinToken(100)).to.be.revertedWith(
      'MINPrivateSwap: sale is still ongoing'
    );
  });

  it('should not let deployer withdraw more unsold mintokens or more than contract has', async function () {
    const swapTokenAmount = BigInt(45) * 10n ** BigInt(DECIMALS);
    await swapToken.connect(deployer).approve(minPrivateSwap, swapTokenAmount);
    await minPrivateSwap.connect(deployer).deposit(swapTokenAmount);
    await time.increase(300);
    await min.connect(deployer).transfer(minPrivateSwap, BigInt(155) * 10n ** BigInt(DECIMALS));
    await minPrivateSwap.connect(deployer).withdrawSwapToken(swapTokenAmount);
    await expect(
      minPrivateSwap.connect(deployer).withdrawMinToken(BigInt(300_000_000) * 10n ** BigInt(DECIMALS))
    ).to.be.revertedWith('MINPrivateSwap: Not enough MIN tokens to withdraw');
  });

  it('should revert withdrawal of unsold mintokens if transfer fails', async function () {
    const swapTokenAmount = BigInt(45) * 10n ** BigInt(DECIMALS);
    await swapToken.connect(deployer).approve(minPrivateSwap, swapTokenAmount);
    await minPrivateSwap.connect(deployer).deposit(swapTokenAmount);
    await time.increase(300);
    await min.connect(deployer).transfer(minPrivateSwap, BigInt(155) * 10n ** BigInt(DECIMALS));
    await minPrivateSwap.connect(deployer).withdrawSwapToken(swapTokenAmount);
    await min.connect(deployer).setToFailTransfer(true);
    await expect(minPrivateSwap.connect(deployer).withdrawMinToken(BigInt(5) * 10n ** BigInt(DECIMALS))).to.be.reverted;
  });
});
