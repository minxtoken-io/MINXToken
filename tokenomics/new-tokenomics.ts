import tokenomics from './json/new-tokenomics.json';
import TEAM_BENEFICIARIES from '../beneficiaries/marka.json'; //TODO: Place the correct files here for the beneficiaries 
import STRATEGIC_BENEFICIARIES from '../beneficiaries/marka-disi-ortak-adresli.json'; //TODO: Place the correct files here for the beneficiaries

const convertNumberToBigInt = (number:number) =>{
  const split = number.toString().split('.');
  if(split.length === 1){
    return BigInt(number) * 10n ** 18n;
  }
  const decimal = BigInt(split[1]);
  const decimalLength = split[1].length;
  if(decimalLength > 18){
    throw new Error('Too many decimal places');
  }
  const multiplier = 10 ** decimalLength;
  return BigInt(number * multiplier) * 10n ** (18n - BigInt(decimalLength));
}

const MONTH = 60 * 60 * 24 * 30;

const START_DATE = Math.floor(new Date('Aug 1 2024 00:00:00 GMT+0300').getTime() / 1000);

const WALLETS = {
strategic: '0x414b466dBc4484F4b7463161dbaaB50c8Db0db1d',
  private: '0xf6479F6615A41Ab92493B037174D6A7F01413d3C',
  public: '0x4701ddB84fB1CF21d94c738D59bDe941a8E27103',
  enGaranti: '0x23fef38422BcC0D5EEb3E6AE82C6084a32ea73b0',
  operations: '0x6E75b04c42F9cCF8E433860BEF02F6b2FEF32314',
  marketingAndRewards: '0xb040c794CD320f6443FF7651FC8808f8A71FF38c',
  devTeam: '0xc1CA44D79032C22d0dC5DA630ba83091F738e2DC',
  reserve: '0x737c7A712fb0364FC69bdd0e510dD6FfD629d344',
  liquidity: '0x1FF580c899a579F7a013E94D3B3a034eC5Bf01B7',
};

const VESTING_SCHEDULES = {

  public: {
    tgePermille: tokenomics.public.tge * 10,
    beneficiary: WALLETS.public,
    startTimestamp: START_DATE,
    cliffDuration:  tokenomics.public.cliff * MONTH,
    vestingDuration: tokenomics.public.vesting * MONTH,
    slicePeriodSeconds: MONTH,
    totalAmount: convertNumberToBigInt(tokenomics.public.amount),
    releasedAmount: 0,
  },
  operations: {
    tgePermille: tokenomics.operations.tge * 10,
    beneficiary: WALLETS.operations,
    startTimestamp: START_DATE,
    cliffDuration: tokenomics.operations.cliff * MONTH,
    vestingDuration: tokenomics.operations.vesting * MONTH,
    slicePeriodSeconds: MONTH,
    totalAmount: convertNumberToBigInt(tokenomics.operations.amount),
    releasedAmount: 0,
  },

  marketingAndRewards: {
    tgePermille: tokenomics.marketing.tge * 10,
    beneficiary: WALLETS.marketingAndRewards,
    startTimestamp: START_DATE,
    cliffDuration: tokenomics.marketing.cliff * MONTH,
    vestingDuration: tokenomics.marketing.vesting * MONTH,
    slicePeriodSeconds: MONTH,
    totalAmount: convertNumberToBigInt(tokenomics.marketing.amount),
    releasedAmount: 0,
  },

  devTeam: {
    tgePermille: tokenomics.devTeam.tge * 10,
    beneficiary: WALLETS.devTeam,
    startTimestamp: START_DATE,
    cliffDuration: tokenomics.devTeam.cliff * MONTH,
    vestingDuration: tokenomics.devTeam.vesting * MONTH,
    slicePeriodSeconds: MONTH,
    totalAmount: convertNumberToBigInt(tokenomics.devTeam.amount),
    releasedAmount: 0,
  },

  reserve: {
    tgePermille: tokenomics.reserve.tge * 10,
    beneficiary: WALLETS.reserve,
    startTimestamp: START_DATE,
    cliffDuration: tokenomics.reserve.cliff * MONTH,
    vestingDuration: tokenomics.reserve.vesting * MONTH,
    slicePeriodSeconds: MONTH,
    totalAmount: convertNumberToBigInt(tokenomics.reserve.amount),
    releasedAmount: 0,
  },

  liquidity: {
    tgePermille: tokenomics.liquidity.tge * 10,
    beneficiary: WALLETS.liquidity,
    startTimestamp: START_DATE,
    cliffDuration: tokenomics.liquidity.cliff * MONTH,
    vestingDuration: tokenomics.liquidity.vesting * MONTH,
    slicePeriodSeconds: MONTH,
    totalAmount: convertNumberToBigInt(tokenomics.liquidity.amount),
    releasedAmount: 0,
  },
  
  strategic: {
    tgePermille: tokenomics.strategic.tge * 10,
    beneficiary: WALLETS.liquidity,
    startTimestamp: START_DATE,
    cliffDuration: tokenomics.strategic.cliff * MONTH,
    vestingDuration: tokenomics.strategic.vesting * MONTH,
    slicePeriodSeconds: MONTH,
    totalAmount: convertNumberToBigInt(tokenomics.strategic.amount),
    releasedAmount: 0,
  },
  
  team: {
    tgePermille: tokenomics.team.tge * 10,
    beneficiary: WALLETS.liquidity,
    startTimestamp: START_DATE,
    cliffDuration: tokenomics.team.cliff* MONTH,
    vestingDuration: tokenomics.team.vesting * MONTH,
    slicePeriodSeconds: MONTH,
    totalAmount: convertNumberToBigInt(tokenomics.team.amount),
    releasedAmount: 0,
  },

};
export {WALLETS, VESTING_SCHEDULES,TEAM_BENEFICIARIES,STRATEGIC_BENEFICIARIES};
