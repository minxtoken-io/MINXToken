import {ethers} from 'hardhat';
import {MINToken__factory, MINVesting__factory, MINStrategicSale__factory, MINPrivateSwap__factory} from '../typechain';
import {VESTING_SCHEDULES} from '../tokenomics/tokenomics';
// This is a script for deploying your contracts. You can adapt it to deploy
// yours, or create new ones.
async function main() {
  // This is just a convenience check
  const swapTokenAddress = '';
  const privateSaleRatio = 30;
  const privateSaleDuration = 60 * 60 * 24 * 30;

  const [deployer] = await ethers.getSigners();
  console.log('Network:', (await ethers.provider.getNetwork()).name);
  console.log('Deploy contracts');
  const minTokenContract = await new MINToken__factory(deployer).deploy(300_000_000n);
  const minTokenAddress = await minTokenContract.getAddress();
  console.log('MIN token contract deployed: ', minTokenAddress);
  const minVestingContract = await new MINVesting__factory(deployer).deploy(minTokenAddress);
  const minVestingAddress = await minVestingContract.getAddress();
  const vestingAmount =
    300_000_000n * 10n ** 18n - VESTING_SCHEDULES.strategic.totalAmount - VESTING_SCHEDULES.private.totalAmount;
  await minTokenContract.connect(deployer).transfer(minVestingAddress, vestingAmount);

  console.log('MIN vesting contract deployed: ', minVestingAddress);
  await minVestingContract.addVestingSchedule(VESTING_SCHEDULES.devTeam);
  await minVestingContract.addVestingSchedule(VESTING_SCHEDULES.enGaranti);
  await minVestingContract.addVestingSchedule(VESTING_SCHEDULES.liquidity);
  await minVestingContract.addVestingSchedule(VESTING_SCHEDULES.marketingAndRewards);
  await minVestingContract.addVestingSchedule(VESTING_SCHEDULES.operations);
  await minVestingContract.addVestingSchedule(VESTING_SCHEDULES.public);
  await minVestingContract.addVestingSchedule(VESTING_SCHEDULES.reserve);
  const minStrategicSaleContract = await new MINStrategicSale__factory(deployer).deploy(
    minTokenAddress,
    VESTING_SCHEDULES.strategic
  );
  const minStrategicSaleAddress = await minStrategicSaleContract.getAddress();
  console.log('MIN strategic sale contract deployed: ', minStrategicSaleAddress);
  await minTokenContract.connect(deployer).transfer(minStrategicSaleAddress, VESTING_SCHEDULES.strategic.totalAmount);

  const minPrivateSwapContract = await new MINPrivateSwap__factory(deployer).deploy(
    minTokenAddress,
    swapTokenAddress,
    privateSaleRatio,
    BigInt(VESTING_SCHEDULES.private.totalAmount),
    VESTING_SCHEDULES.private,
    privateSaleDuration
  );
  const minPrivateSwapAddress = await minPrivateSwapContract.getAddress();
  console.log('MIN private swap contract deployed: ', minPrivateSwapAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
