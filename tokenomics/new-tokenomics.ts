import tokenomics from './json/new-tokenomics.json';
import ALL_BENEFICIARIES from '../beneficiaries/total_sales.json'; //TODO: Place the correct files here for the beneficiaries 

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

const START_DATE = Math.floor(new Date('Aug 6 2024 13:00:00 UTC').getTime() / 1000);

const START_DATE_REST = Math.floor(new Date('Aug 3 2024 13:00:00 UTC').getTime() / 1000);

const WALLETS = {
  public: '0x5A70d191CeA54EE4e82719Cb61a566e1b8A2C881',
  operations: '0xbDb10e6eac81634d6f929eC44C6CE82Fc96f7845',
  marketingAndRewards: '0xC566CB3E7a7b8ea07B93B27E3ba0Af92eae2dc3C',
  devTeam: '0x3673D641641D1d87761CBb2B5aa11249F5327BD3',
  reserve: '0xBfcBc0665dB6cF1ce11b55F7c46656B5ed57E9B2',
  liquidity: '0xb2a14d93761E647afba4e0600d16f9FF9A12563e',
};

const VESTING_SCHEDULES = {

  public: {
    tgePermille: tokenomics.public.tge * 10,
    beneficiary: WALLETS.public,
    startTimestamp: START_DATE_REST,
    cliffDuration:  tokenomics.public.cliff * MONTH,
    vestingDuration: tokenomics.public.vesting * MONTH,
    slicePeriodSeconds: MONTH,
    totalAmount: convertNumberToBigInt(tokenomics.public.amount),
    releasedAmount: 0,
  },
  operations: {
    tgePermille: tokenomics.operations.tge * 10,
    beneficiary: WALLETS.operations,
    startTimestamp: START_DATE_REST,
    cliffDuration: tokenomics.operations.cliff * MONTH,
    vestingDuration: tokenomics.operations.vesting * MONTH,
    slicePeriodSeconds: MONTH,
    totalAmount: convertNumberToBigInt(tokenomics.operations.amount),
    releasedAmount: 0,
  },

  marketingAndRewards: {
    tgePermille: tokenomics.marketing.tge * 10,
    beneficiary: WALLETS.marketingAndRewards,
    startTimestamp: START_DATE_REST,
    cliffDuration: tokenomics.marketing.cliff * MONTH,
    vestingDuration: tokenomics.marketing.vesting * MONTH,
    slicePeriodSeconds: MONTH,
    totalAmount: convertNumberToBigInt(tokenomics.marketing.amount),
    releasedAmount: 0,
  },

  devTeam: {
    tgePermille: tokenomics.devTeam.tge * 10,
    beneficiary: WALLETS.devTeam,
    startTimestamp: START_DATE_REST,
    cliffDuration: tokenomics.devTeam.cliff * MONTH,
    vestingDuration: tokenomics.devTeam.vesting * MONTH,
    slicePeriodSeconds: MONTH,
    totalAmount: convertNumberToBigInt(tokenomics.devTeam.amount),
    releasedAmount: 0,
  },

  reserve: {
    tgePermille: tokenomics.reserve.tge * 10,
    beneficiary: WALLETS.reserve,
    startTimestamp: START_DATE_REST,
    cliffDuration: tokenomics.reserve.cliff * MONTH,
    vestingDuration: tokenomics.reserve.vesting * MONTH,
    slicePeriodSeconds: MONTH,
    totalAmount: convertNumberToBigInt(tokenomics.reserve.amount),
    releasedAmount: 0,
  },

  liquidity: {
    tgePermille: tokenomics.liquidity.tge * 10,
    beneficiary: WALLETS.liquidity,
    startTimestamp: START_DATE_REST,
    cliffDuration: tokenomics.liquidity.cliff * MONTH,
    vestingDuration: tokenomics.liquidity.vesting * MONTH,
    slicePeriodSeconds: MONTH,
    totalAmount: convertNumberToBigInt(tokenomics.liquidity.amount),
    releasedAmount: 0,
  },
  
  strategic: {
    tgePermille: tokenomics.strategic.tge * 10,
    beneficiary: "",
    startTimestamp: START_DATE,
    cliffDuration: tokenomics.strategic.cliff * MONTH,
    vestingDuration: tokenomics.strategic.vesting * MONTH,
    slicePeriodSeconds: MONTH,
    totalAmount: convertNumberToBigInt(tokenomics.strategic.amount),
    releasedAmount: 0,
  },
  
  ecosystem: {
    tgePermille: tokenomics.ecosystem.tge * 10,
    beneficiary: "",
    startTimestamp: START_DATE,
    cliffDuration: tokenomics.ecosystem.cliff* MONTH,
    vestingDuration: tokenomics.ecosystem.vesting * MONTH,
    slicePeriodSeconds: MONTH,
    totalAmount: convertNumberToBigInt(tokenomics.ecosystem.amount),
    releasedAmount: 0,
  },

};
export {WALLETS, VESTING_SCHEDULES,ALL_BENEFICIARIES};
