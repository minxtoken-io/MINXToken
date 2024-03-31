// SPDX-License-Identifier: MIT
// En Garanti Teknoloji 2024

pragma solidity 0.8.20;

import "../utils/MINStructs.sol";

import "../utils/MINVestingBase.sol";

/**
 * @title MINVesting
 * @dev This contract handles the vesting schedule for the MIN token.
 */
contract MINVesting is MINVestingBase {
    using MINStructs for MINStructs.VestingSchedule;

    /**
     * @dev Sets the MIN token and the owner of the contract.
     * @param token The MIN token.
     */
    constructor(MINToken token) MINVestingBase(token) {}

    /**
     * @dev Sets up the vesting schedules for the beneficiaries.
     * @param vestingSchedules The vesting schedules for the beneficiaries.
     */
    function setUpVestingSchedules(MINStructs.VestingSchedule[] memory vestingSchedules) public onlyOwner {
        uint256 requiredTotalAmount = 0;
        for (uint256 i = 0; i < vestingSchedules.length; i++) {
            requiredTotalAmount += vestingSchedules[i].totalAmount;
        }
        require(
            getToken().balanceOf(address(this)) >= requiredTotalAmount,
            "MINVesting: insufficient balance for vesting schedules"
        );

        for (uint256 i = 0; i < vestingSchedules.length; i++) {
            MINStructs.VestingSchedule memory vestingSchedule = vestingSchedules[i];
            setVestingSchedule(vestingSchedule);
        }
    }
}
