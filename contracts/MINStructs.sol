// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title VestingSchedule
 */
library MINStructs {
    struct VestingSchedule {
        // permille of the total amount of tokens to be released at TGE
        uint256 tgePermille;
        // beneficiary of tokens after they are released
        address beneficiary;
        // start time of the vesting period
        uint256 startTimestamp;
        // cliff period in seconds
        uint256 cliffDuration;
        // duration of the vesting period in seconds
        uint256 vestingDuration;
        // duration of a slice period for the vesting in seconds
        uint256 slicePeriodSeconds;
        // total amount of tokens to be released at the end of the vesting
        uint256 totalAmount;
        // amount of tokens released
        uint256 releasedAmount;
    }
}
