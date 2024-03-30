// SPDX-License-Identifier: MIT
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

    /**
     * @dev Sets up the vesting schedules for the beneficiaries.
     * @param vestingSchedules The vesting schedules for the beneficiaries.
     */
    function setUpVestingSchedules(
        MINStructs.VestingSchedule[] memory vestingSchedules
    ) public onlyOwner {
        uint256 requiredTotalAmount = 0;
        for (uint256 i = 0; i < vestingSchedules.length; i++) {
            requiredTotalAmount += vestingSchedules[i].totalAmount;
        }
        require(
            getToken().balanceOf(address(this)) >= requiredTotalAmount,
            "MINVesting: insufficient balance for vesting schedules"
        );

        // An array to hold the transfers to be made

        MINStructs.Transfer[] memory transfers = new MINStructs.Transfer[](
            vestingSchedules.length
        );

        for (uint256 i = 0; i < vestingSchedules.length; i++) {
            MINStructs.VestingSchedule memory vestingSchedule = vestingSchedules[i];
            setVestingSchedule(vestingSchedule);
            if (vestingSchedule.tgePermille > 0) {
                uint256 tgeAmount = (vestingSchedule.totalAmount * vestingSchedule.tgePermille) /
                    1000;
                MINStructs.VestingSchedule memory vs = getVestingSchedule(
                    vestingSchedule.beneficiary
                );
                vs.totalAmount -= tgeAmount;
                setVestingSchedule(vs);

                // Store the transfer to be made
                transfers[i] = MINStructs.Transfer(vestingSchedule.beneficiary, tgeAmount);
            }
        }

        // Make the transfers after all state changes
        for (uint256 i = 0; i < transfers.length; i++) {
            if (transfers[i].amount > 0) {
                SafeERC20.safeTransfer(getToken(), transfers[i].to, transfers[i].amount);
            }
        }
    }
}
