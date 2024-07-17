import {ethers} from 'hardhat';
import {MINToken__factory, MINVesting__factory, MINStrategicSale__factory, MINPrivateSwap__factory} from '../typechain';
import hre from 'hardhat';
async function main() {

  const [deployer] = await ethers.getSigners();
  console.log('Network:', (await ethers.provider.getNetwork()).name);
  console.log('Deploy contracts');
  const minTokenContract = await new MINToken__factory(deployer).deploy(35_000_000n);
  console.log("Waiting for deployment transaction to be mined...")
  await minTokenContract.waitForDeployment();
  const minTokenAddress = await minTokenContract.getAddress();
  console.log('MIN token contract deployed: ', minTokenAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
