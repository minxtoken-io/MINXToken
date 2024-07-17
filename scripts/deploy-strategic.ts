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
import {VESTING_SCHEDULES, STRATEGIC_BENEFICIARIES} from '../tokenomics/new-tokenomics';
import {Decimal} from 'decimal.js';
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Network:', (await ethers.provider.getNetwork()).name);
  console.log('Deploy contracts');
  const tokenAddress = '';
  assert(tokenAddress !== '', 'Token address is required');

  const minTokenContract = MINToken__factory.connect(tokenAddress, deployer);
  const minStrategicSaleContract = await new MINStrategicSale__factory(deployer).deploy(
    tokenAddress,

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
  console.log('Waiting for deployment transaction to be mined...');
  await minStrategicSaleContract.waitForDeployment();
  const minStrategicSaleContractAddress = await minStrategicSaleContract.getAddress();
  console.log('MIN strategic sale contract deployed: ', minStrategicSaleContractAddress);
  console.log(`Transferring ${VESTING_SCHEDULES.strategic.totalAmount} tokens to the strategic sale contract`);
  await (
    await minTokenContract
      .connect(deployer)
      .transfer(minStrategicSaleContractAddress, BigInt(VESTING_SCHEDULES.strategic.totalAmount))
  ).wait(5);
  for (const beneficiary of STRATEGIC_BENEFICIARIES) {
    const decimalAmount = new Decimal(beneficiary.tokens);
    const multiplier = new Decimal(10).pow(18);
    const amount = decimalAmount.mul(multiplier).toFixed();
    console.log(`Adding beneficiary ${beneficiary.name} to the strategic sale contract`);
    await (await await minStrategicSaleContract.addBeneficiary(beneficiary.address, BigInt(amount))).wait(5);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
