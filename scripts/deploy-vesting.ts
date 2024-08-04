import {ethers} from 'hardhat';
import {
  MINToken,
  MINToken__factory,
  MINVesting__factory,
  MINStrategicSale__factory,
  MINPrivateSwap__factory,
} from '../typechain';
import hre from 'hardhat';
import assert from 'assert';
import {VESTING_SCHEDULES} from '../tokenomics/new-tokenomics';
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Network:', (await ethers.provider.getNetwork()).name);
  console.log('Deploy contracts');

  const tokenAddress = '0x552f4D98F338fBbD3175ddf38cE1260F403Bbba2';
  assert(tokenAddress !== '', 'Token address is required');
  const minTokenContract = MINToken__factory.connect(tokenAddress, deployer);

  const minVestingContract = await new MINVesting__factory(deployer).deploy(tokenAddress);
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

  let totalAmountToTransfer = 0n;
  for (const schedule of schedules) {
    totalAmountToTransfer += schedule.totalAmount;
  }

  console.log(`Transferring ${totalAmountToTransfer} tokens to the vesting contract`);
  const transferTx = await minTokenContract
    .connect(deployer)
    .transfer(minVestingContractAddress, totalAmountToTransfer);
  console.log('Waiting for transfer transaction to be mined...');
  await transferTx.wait(5);

  for (const schedule of schedules) {
    console.log(`Adding vesting schedule for ${schedule.beneficiary}`);
    console.log(`Transferring ${schedule.totalAmount} tokens to the vesting contract`);

    try {
      console.log('Adding vesting schedule');
      const addScheduleTx = await minVestingContract.connect(deployer).addVestingSchedule(schedule);
      console.log('Waiting for add schedule transaction to be mined...');
      await addScheduleTx.wait(5);
    } catch (error) {
      console.error(`Error adding vesting schedule for ${schedule.beneficiary}:`, error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
