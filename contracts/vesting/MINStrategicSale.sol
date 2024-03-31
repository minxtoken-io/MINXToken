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

    constructor(MINToken token, MINStructs.VestingSchedule memory strategicSaleVestingSchedule) MINVestingBase(token) {
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
            MINStructs.VestingSchedule memory vestingSchedule = getVestingSchedule(_beneficiaries[i]);
            totalAmount += vestingSchedule.totalAmount - vestingSchedule.releasedAmount;
        }
        return getToken().balanceOf(address(this)) - totalAmount;
    }
}
