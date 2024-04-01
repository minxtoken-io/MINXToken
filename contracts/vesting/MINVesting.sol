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
    constructor(IERC20 token) MINVestingBase(token) {}

    function addVestingSchedule(MINStructs.VestingSchedule memory vestingSchedule) public onlyOwner {
        require(
            vestingSchedule.totalAmount <= getToken().balanceOf(address(this)) - getTotalReservedAmount(),
            "MINVesting: insufficient balance for vesting schedule"
        );

        setVestingSchedule(vestingSchedule);
    }
}
