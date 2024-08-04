

const convertNumberToBigInt = (number) =>{
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




module.exports = [
    "0x552f4D98F338fBbD3175ddf38cE1260F403Bbba2",
    {
        tgePermille: 100,
        beneficiary: '0x0000000000000000000000000000000000000000',
        cliffDuration: 60 * 60 * 24 * 30 * 2,
        slicePeriodSeconds: 60 * 60 * 24 * 30,
        startTimestamp: 1722949200,
        totalAmount: convertNumberToBigInt(7242898.88),
        vestingDuration: 60 * 60 * 24 * 30 * 18,
        releasedAmount: 0,
      }
]