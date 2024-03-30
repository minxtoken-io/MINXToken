// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./MINStructs.sol";

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MINVesting
 * @dev This contract handles the vesting schedule for the MIN token.
 */
contract MINVesting is Ownable {
    using MINStructs for MINStructs.VestingSchedule;

    // Mapping of beneficiary addresses to their vesting schedules
    mapping(address => MINStructs.VestingSchedule) private _vestingSchedules;

    // The MIN token
    IERC20 private immutable _token;

    /**
     * @dev Sets the MIN token and the owner of the contract.
     * @param token The MIN token.
     */
    constructor(IERC20 token) Ownable(msg.sender) {
        _token = token;
    }

    /**
     * @dev Modifier to make a function callable only by beneficiaries.
     */
    modifier onlyBeneficiary() {
        require(
            _vestingSchedules[msg.sender].beneficiary == msg.sender,
            "MINVesting: caller is not a beneficiary"
        );
        _;
    }

    /**
     * @dev Sets up the vesting schedules for the beneficiaries.
     * @param vestingSchedules The vesting schedules for the beneficiaries.
     */
    function setUpVestingSchedules(
        MINStructs.VestingSchedule[] memory vestingSchedules
    ) public onlyOwner {
        uint256 requiredTotalAmount = 0;
        for (uint256 i = 0; i < vestingSchedules.length; i++) {
            uint256 tgePermille = vestingSchedules[i].tgePermille;
            uint256 totalAmount = vestingSchedules[i].totalAmount;
            uint256 tgeAmount = (totalAmount * tgePermille) / 1000;
            uint256 vestingAmount = totalAmount - tgeAmount;
            requiredTotalAmount += vestingAmount;
        }
        require(
            _token.balanceOf(address(this)) >= requiredTotalAmount,
            "MINVesting: insufficient balance for vesting schedules"
        );
        for (uint256 i = 0; i < vestingSchedules.length; i++) {
            MINStructs.VestingSchedule memory vestingSchedule = vestingSchedules[i];
            _vestingSchedules[vestingSchedule.beneficiary] = vestingSchedule;
        }
    }

    /**
     * @dev Returns the vesting schedule for a beneficiary.
     * @param beneficiary The address of the beneficiary.
     * @return The vesting schedule of the beneficiary.
     */
    function getVestingScheduleForBeneficiary(
        address beneficiary
    ) public view returns (MINStructs.VestingSchedule memory) {
        return _vestingSchedules[beneficiary];
    }

    /**
     * @dev Releases the vested tokens to the beneficiary.
     * @param amount The amount of tokens to release.
     */
    function release(uint256 amount) public onlyBeneficiary {
        uint256 releasableAmount = computeReleasableAmount(msg.sender);
        require(releasableAmount > 0, "MINVesting: no tokens are due");
        require(releasableAmount >= amount, "MINVesting: amount exceeds releasable amount");
        MINStructs.VestingSchedule storage vestingSchedule = _vestingSchedules[msg.sender];
        vestingSchedule.releasedAmount += amount;

        SafeERC20.safeTransfer(_token, msg.sender, amount);
    }

    /**
     * @dev Computes the amount of tokens that can be released to a beneficiary.
     * @param beneficiary The address of the beneficiary.
     * @return The amount of tokens that can be released.
     */
    function computeReleasableAmount(address beneficiary) public view returns (uint256) {
        MINStructs.VestingSchedule storage vestingSchedule = _vestingSchedules[beneficiary];
        uint256 currentTime = getCurrentTime();
        if (currentTime < vestingSchedule.startTimestamp + vestingSchedule.cliffDuration) {
            return 0;
        } else if (
            currentTime >=
            vestingSchedule.startTimestamp +
                vestingSchedule.cliffDuration +
                vestingSchedule.vestingDuration
        ) {
            return vestingSchedule.totalAmount - vestingSchedule.releasedAmount;
        } else {
            uint256 timeFromStart = currentTime -
                (vestingSchedule.startTimestamp + vestingSchedule.cliffDuration);
            uint256 secondsPerSlice = vestingSchedule.slicePeriodSeconds;
            uint256 vestedSlicePeriods = timeFromStart / secondsPerSlice;
            uint256 vestedSeconds = vestedSlicePeriods * secondsPerSlice;
            // Compute the amount of tokens that are vested.
            uint256 vestedAmount = (vestingSchedule.totalAmount * vestedSeconds) /
                vestingSchedule.vestingDuration;
            // Subtract the amount already released and return.
            return vestedAmount - vestingSchedule.releasedAmount;
        }
    }

    /**
     * @dev Returns the current time.
     * @return The current timestamp in seconds.
     */
    function getCurrentTime() internal view virtual returns (uint256) {
        return block.timestamp;
    }
}
