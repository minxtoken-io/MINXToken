import {time, loadFixture} from '@nomicfoundation/hardhat-toolbox/network-helpers';
import {anyValue} from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import {expect} from 'chai';
import {ethers} from 'hardhat';
import {MINToken, MINToken__factory} from '../typechain';
import {SignerWithAddress} from '@nomicfoundation/hardhat-ethers/signers';

let deployer: SignerWithAddress;
let min: MINToken;
const AMOUNT = 300_000_000;
const DECIMALS = 18;
describe('MINToken', function () {
  // should be able to deploy
  beforeEach('should be deployed', async function () {
    deployer = await ethers.provider.getSigner(0);
    min = await new MINToken__factory(deployer).deploy(AMOUNT);
  });
  it('should have the correct name', async function () {
    expect(await min.name()).to.equal('MIN Token');
  });
  it('should have the correct symbol', async function () {
    expect(await min.symbol()).to.equal('MIN');
  });
  it('should have the correct decimals', async function () {
    expect(await min.decimals()).to.equal(DECIMALS);
  });
  it('should have the correct total supply', async function () {
    expect(await min.totalSupply()).to.equal(BigInt(AMOUNT) * 10n ** BigInt(DECIMALS));
  });
});
