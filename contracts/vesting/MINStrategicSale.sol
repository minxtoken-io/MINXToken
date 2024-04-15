// SPDX-License-Identifier: MIT
// En Garanti Teknoloji 2024

pragma solidity 0.8.20;

/**
 * @title MINStrategicSale
 */

import "../utils/MINStructs.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../utils/MINVestingBase.sol";

/**
 * @title MINStrategicSale
 * @dev This contract manages the strategic sale of MIN tokens. It allows the owner to add beneficiaries and set their vesting schedules.
 * It also allows the owner to withdraw MIN tokens up to the amount that is not allocated to beneficiaries.
 */
contract MINStrategicSale is MINVestingBase {
    using MINStructs for MINStructs.VestingSchedule;
    using SafeERC20 for IERC20;

    MINStructs.VestingSchedule private _strategicSaleVestingSchedule;

    /**
     * @dev Emitted when a beneficiary is added to the strategic sale.
     * @param beneficiary The address of the beneficiary.
     * @param amount The amount of tokens allocated to the beneficiary.
     */
    event BeneficiaryAdded(address indexed beneficiary, uint256 amount);
    /**
     * @dev Emitted when the owner withdraws MIN tokens.
     * @param amount The amount of tokens withdrawn.
     */
    event OwnerMinTokenWithdraw(uint256 amount);

    /**
     * @dev Constructs the MINStrategicSale contract.
     * @param token The MIN token to be sold.
     * @param strategicSaleVestingSchedule The vesting schedule for the strategic sale.
     */
    constructor(IERC20 token, MINStructs.VestingSchedule memory strategicSaleVestingSchedule) MINVestingBase(token) {
        _strategicSaleVestingSchedule = strategicSaleVestingSchedule;
    }

    /**
     * @dev Adds a beneficiary to the strategic sale.
     * @param beneficiary The address of the beneficiary.
     * @param amount The amount of tokens allocated to the beneficiary.
     */
    function addBeneficiary(address beneficiary, uint256 amount) public onlyOwner {
        require(beneficiary != address(0), "MINStrategicSale: beneficiary address cannot be 0");
        require(
            getVestingSchedule(beneficiary).beneficiary == address(0),
            "MINStrategicSale: beneficiary already exists"
        );

        require(amount > 0, "MINStrategicSale: amount must be greater than 0");
        require(
            amount <= computeWithdrawableMintokens(),
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

        _setVestingSchedule(vestingSchedule);
        addToTotalReservedAmount(amount);

        emit BeneficiaryAdded(beneficiary, amount);
    }

    /**
     * @dev Allows the owner to withdraw MIN tokens up to the amount that is not allocated to beneficiaries.
     * @param amount The amount of tokens to withdraw.
     */
    function withdrawMinTokens(uint256 amount) public onlyOwner {
        require(
            amount <= computeWithdrawableMintokens(),
            "MINStrategicSale: cannot withdraw more than beneficiary's total amount"
        );

        emit OwnerMinTokenWithdraw(amount);
        SafeERC20.safeTransfer(getToken(), owner(), amount);
    }

    /**
     * @dev Computes the amount of MIN tokens that can be withdrawn by the owner.
     * @return The amount of withdrawable tokens.
     */
    function computeWithdrawableMintokens() public view returns (uint256) {
        return getToken().balanceOf(address(this)) - (getTotalReservedAmount() - getTotalReleasedAmount());
    }
}
