// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title MINStructs
 * @dev A library for managing MIN token related structures.
 */
library MINStructs {
    /**
     * @dev Struct to represent a vesting schedule for MIN tokens.
     * @param tgePermille The permille (parts per thousand) of the total amount of tokens to be released at Token Generation Event (TGE).
     * @param beneficiary The address that will receive the tokens after they are released.
     * @param startTimestamp The start time of the vesting period, in Unix time.
     * @param cliffDuration The duration of the cliff period, in seconds. No tokens are released during the cliff period.
     * @param vestingDuration The total duration of the vesting period, in seconds.
     * @param slicePeriodSeconds The duration of a slice period for the vesting, in seconds. Tokens are released in slices.
     * @param totalAmount The total amount of tokens to be released by the end of the vesting period.
     * @param releasedAmount The amount of tokens that have already been released.
     */
    struct VestingSchedule {
        uint256 tgePermille;
        address beneficiary;
        uint256 startTimestamp;
        uint256 cliffDuration;
        uint256 vestingDuration;
        uint256 slicePeriodSeconds;
        uint256 totalAmount;
        uint256 releasedAmount;
    }
}
