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
import {VESTING_SCHEDULES, STRATEGIC_BENEFICIARIES, TEAM_BENEFICIARIES} from '../tokenomics/new-tokenomics';
import {Decimal} from 'decimal.js';
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Network:', (await ethers.provider.getNetwork()).name);
  console.log('Deploy contracts');
  const tokenAddress = '';
  assert(tokenAddress !== '', 'Token address is required');

  const minTokenContract = MINToken__factory.connect(tokenAddress, deployer);
  const minTeamContract = await new MINStrategicSale__factory(deployer).deploy(
    tokenAddress,

    {
      tgePermille: VESTING_SCHEDULES.team.tgePermille,
      beneficiary: '0x0000000000000000000000000000000000000000',
      cliffDuration: VESTING_SCHEDULES.team.cliffDuration,
      slicePeriodSeconds: VESTING_SCHEDULES.team.slicePeriodSeconds,
      startTimestamp: VESTING_SCHEDULES.team.startTimestamp,
      totalAmount: VESTING_SCHEDULES.team.totalAmount,
      vestingDuration: VESTING_SCHEDULES.team.vestingDuration,
      releasedAmount: VESTING_SCHEDULES.team.releasedAmount,
    }
  );
  console.log('Waiting for deployment transaction to be mined...');
  await minTeamContract.waitForDeployment();
  const minTeamContractAddress = await minTeamContract.getAddress();
  console.log('MIN team contract deployed: ', minTeamContractAddress);
  console.log(`Transferring ${VESTING_SCHEDULES.team.totalAmount} tokens to the team contract`);
  await (
    await minTokenContract
      .connect(deployer)
      .transfer(minTeamContractAddress, BigInt(VESTING_SCHEDULES.team.totalAmount))
  ).wait(5);
  for (const beneficiary of TEAM_BENEFICIARIES) {
    const decimalAmount = new Decimal(beneficiary.tokens);
    const multiplier = new Decimal(10).pow(18);
    const amount = decimalAmount.mul(multiplier).toFixed();
    console.log(`Adding beneficiary ${beneficiary.name} to the strategic sale contract`);
    await (await await minTeamContract.addBeneficiary(beneficiary.address, BigInt(amount))).wait(5);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
