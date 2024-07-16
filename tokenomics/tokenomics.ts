const START_DATE = Math.floor(Date.now() / 1000);
const MONTH = 60 * 60 * 24 * 30;

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
  strategic: {
    tgePermille: 100,
    beneficiary: WALLETS.strategic,
    startTimestamp: START_DATE,
    cliffDuration: 2 * MONTH,
    vestingDuration: 18 * MONTH,
    slicePeriodSeconds: MONTH,
    totalAmount: BigInt(7_500_000) * 10n ** 18n,
    releasedAmount: 0,
  },
  private: {
    tgePermille: 0,
    beneficiary: WALLETS.private,
    startTimestamp: START_DATE + MONTH,
    cliffDuration: 4 * MONTH,
    vestingDuration: 12 * MONTH,
    slicePeriodSeconds: MONTH,
    totalAmount: BigInt(1_500_000) * 10n ** 18n,
    releasedAmount: 0,
  },

  public: {
    tgePermille: 100,
    beneficiary: WALLETS.public,
    startTimestamp: START_DATE,
    cliffDuration: 2 * MONTH,
    vestingDuration: 18 * MONTH,
    slicePeriodSeconds: MONTH,
    totalAmount: BigInt(27_000_000) * 10n ** 18n,
    releasedAmount: 0,
  },

  enGaranti: {
    tgePermille: 0,
    beneficiary: WALLETS.enGaranti,
    startTimestamp: START_DATE,
    cliffDuration: 3 * MONTH,
    vestingDuration: 60 * MONTH,
    slicePeriodSeconds: MONTH,
    totalAmount: BigInt(30_000_000) * 10n ** 18n,
    releasedAmount: 0,
  },

  operations: {
    tgePermille: 0,
    beneficiary: WALLETS.operations,
    startTimestamp: START_DATE,
    cliffDuration: 6 * MONTH,
    vestingDuration: 48 * MONTH,
    slicePeriodSeconds: MONTH,
    totalAmount: BigInt(24_000_000) * 10n ** 18n,
    releasedAmount: 0,
  },

  marketingAndRewards: {
    tgePermille: 15,
    beneficiary: WALLETS.marketingAndRewards,
    startTimestamp: START_DATE,
    cliffDuration: 0 * MONTH,
    vestingDuration: 59 * MONTH,
    slicePeriodSeconds: MONTH,
    totalAmount: BigInt(60_000_000) * 10n ** 18n,
    releasedAmount: 0,
  },

  devTeam: {
    tgePermille: 0,
    beneficiary: WALLETS.devTeam,
    startTimestamp: START_DATE,
    cliffDuration: 3 * MONTH,
    vestingDuration: 60 * MONTH,
    slicePeriodSeconds: MONTH,
    totalAmount: BigInt(30_000_000) * 10n ** 18n,
    releasedAmount: 0,
  },

  reserve: {
    tgePermille: 0,
    beneficiary: WALLETS.reserve,
    startTimestamp: START_DATE,
    cliffDuration: 48 * MONTH,
    vestingDuration: 12 * MONTH,
    slicePeriodSeconds: MONTH,
    totalAmount: BigInt(90_000_000) * 10n ** 18n,
    releasedAmount: 0,
  },

  liquidity: {
    tgePermille: 300,
    beneficiary: WALLETS.liquidity,
    startTimestamp: START_DATE,
    cliffDuration: 3 * MONTH,
    vestingDuration: 21 * MONTH,
    slicePeriodSeconds: MONTH,
    totalAmount: BigInt(30_000_000) * 10n ** 18n,
    releasedAmount: 0,
  },
};

export {WALLETS, VESTING_SCHEDULES};
