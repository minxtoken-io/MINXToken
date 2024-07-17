import {ethers} from 'hardhat';
import {MINToken,MINToken__factory, MINVesting__factory, MINStrategicSale__factory, MINPrivateSwap__factory} from '../typechain';
import hre from 'hardhat';
import assert from 'assert';
import {VESTING_SCHEDULES} from '../tokenomics/new-tokenomics';
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Network:', (await ethers.provider.getNetwork()).name);
  console.log('Deploy contracts');
  const tokenAddress = '';
  assert(tokenAddress !== '', 'Token address is required');
  const minVestingContract = await new MINVesting__factory(deployer).deploy(tokenAddress);
  const minTokenContract = MINToken__factory.connect(tokenAddress, deployer);
  console.log('Waiting for deployment transaction to be mined...');
  await minVestingContract.waitForDeployment();
  const minVestingContractAddress = await minVestingContract.getAddress();
  console.log('MIN vesting contract deployed: ', minVestingContractAddress);

  const schedules = [
    VESTING_SCHEDULES.public,
    VESTING_SCHEDULES.operations,
    VESTING_SCHEDULES.marketingAndRewards,
    VESTING_SCHEDULES.devTeam,
    VESTING_SCHEDULES.reserve,
    VESTING_SCHEDULES.liquidity,
  ];
  for (const schedule of schedules) {
    console.log(`Adding vesting schedule for ${schedule.beneficiary}`);
    console.log(`Transferring ${schedule.totalAmount} tokens to the vesting contract`);
    await (await minTokenContract.connect(deployer).transfer(minVestingContractAddress, schedule.totalAmount)).wait(5);
    console.log('Adding vesting schedule');
    await (await minVestingContract.addVestingSchedule(schedule)).wait(5);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
