// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title MINStrategicSale
 */

import "../utils/MINStructs.sol";

import "../utils/MINVestingBase.sol";

contract MINStrategicSale is MINVestingBase {
    using MINStructs for MINStructs.VestingSchedule;
    address[] private _beneficiaries;
    mapping(address => bool) private _addedToBeneficiaries;
    mapping(address => uint256) private _swapTokenBalances;

    MINStructs.VestingSchedule private _strategicSaleVestingSchedule;

    constructor(
        IERC20 token,
        MINStructs.VestingSchedule memory strategicSaleVestingSchedule
    ) MINVestingBase(token) {
        _strategicSaleVestingSchedule = strategicSaleVestingSchedule;
    }

    function addBeneficiary(address beneficiary, uint256 amount) public onlyOwner {
        require(
            getVestingSchedule(beneficiary).beneficiary == address(0),
            "MINStrategicSale: beneficiary already exists"
        );

        require(amount > 0, "MINStrategicSale: amount must be greater than 0");
        require(
            amount <= getToken().balanceOf(address(this)),
            "MINStrategicSale: amount must be less than or equal to contract balance"
        );

        MINStructs.VestingSchedule memory vestingSchedule = MINStructs.VestingSchedule({
            tgePermille: _strategicSaleVestingSchedule.tgePermille,
            beneficiary: beneficiary,
            startTimestamp: _strategicSaleVestingSchedule.startTimestamp,
            cliffDuration: _strategicSaleVestingSchedule.cliffDuration,
            vestingDuration: _strategicSaleVestingSchedule.vestingDuration,
            slicePeriodSeconds: _strategicSaleVestingSchedule.slicePeriodSeconds,
            totalAmount: amount,
            releasedAmount: 0
        });

        _beneficiaries.push(beneficiary);
        setVestingSchedule(vestingSchedule);
    }

    function withdrawMinTokens(uint256 amount) public onlyOwner {
        require(
            amount <= computeWithdrawableMintokens(),
            "MINStrategicSale: cannot withdraw more than beneficiary's total amount"
        );

        getToken().transfer(msg.sender, amount);
    }

    function computeWithdrawableMintokens() public view returns (uint256) {
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            MINStructs.VestingSchedule memory vestingSchedule = getVestingSchedule(
                _beneficiaries[i]
            );
            totalAmount += vestingSchedule.totalAmount - vestingSchedule.releasedAmount;
        }
        return getToken().balanceOf(address(this)) - totalAmount;
    }

    function computeReleasableAmount(address beneficiary) public view override returns (uint256) {
        require(
            getVestingSchedule(beneficiary).beneficiary == beneficiary,
            "MINVesting: beneficiary not found"
        );
        MINStructs.VestingSchedule memory vestingSchedule = getVestingSchedule(beneficiary);
        uint256 currentTime = getCurrentTime();
        uint256 totalWithdrawableAmount = 0;
        uint256 totalAmountWithoutTge = 0;

        if (vestingSchedule.tgePermille > 0) {
            uint256 tgeAmount = (vestingSchedule.totalAmount * vestingSchedule.tgePermille) / 1000;
            totalWithdrawableAmount += tgeAmount;
            totalAmountWithoutTge = vestingSchedule.totalAmount - tgeAmount;
        } else {
            totalAmountWithoutTge = vestingSchedule.totalAmount;
        }
        if (currentTime < vestingSchedule.startTimestamp + vestingSchedule.cliffDuration) {
            totalAmountWithoutTge = 0;
        } else if (
            !(currentTime >=
                vestingSchedule.startTimestamp +
                    vestingSchedule.cliffDuration +
                    vestingSchedule.vestingDuration)
        ) {
            uint256 timeFromStart = currentTime -
                (vestingSchedule.startTimestamp + vestingSchedule.cliffDuration);
            uint256 secondsPerSlice = vestingSchedule.slicePeriodSeconds;
            // Division before multiplication is intentional to floor the result.
            uint256 vestedSlicePeriods = timeFromStart / secondsPerSlice;
            uint256 vestedSeconds = vestedSlicePeriods * secondsPerSlice;
            // Compute the amount of tokens that are vested.
            uint256 vestedAmount = (totalAmountWithoutTge * vestedSeconds) /
                vestingSchedule.vestingDuration;
            // Subtract the amount already released and return.
            totalWithdrawableAmount += vestedAmount;
        }
        return totalWithdrawableAmount - vestingSchedule.releasedAmount;
    }
}
