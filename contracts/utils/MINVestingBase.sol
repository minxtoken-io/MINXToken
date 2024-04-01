// SPDX-License-Identifier: MIT
// En Garanti Teknoloji 2024
pragma solidity 0.8.20;
import "./MINStructs.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MINVestingBase
 * @dev This contract handles the vesting schedule for the MIN token.
 * It provides functionality to set vesting schedules for beneficiaries,
 * compute the releasable amount of tokens for a beneficiary, and release vested tokens to a beneficiary.
 * The contract is Ownable, meaning it has an owner who can perform certain administrative functions.
 */
abstract contract MINVestingBase is Ownable {
    using MINStructs for MINStructs.VestingSchedule;
    using SafeERC20 for IERC20;

    // Mapping of beneficiary addresses to their vesting schedules
    mapping(address => MINStructs.VestingSchedule) private _vestingSchedules;

    uint256 private _totalReleasedAmount = 0;
    uint256 private _totalReservedAmount = 0;
    // The MIN token
    IERC20 private immutable _token;

    /**
     * @dev Sets the MIN token and the owner of the contract.
     * @param token The MIN token.
     */
    constructor(IERC20 token) Ownable(msg.sender) {
        _token = token;
    }

    event VestingScheduleSet(address indexed beneficiary, MINStructs.VestingSchedule vestingSchedule);
    event TokensReleased(address indexed beneficiary, uint256 amount);
    event TotalReservedAmountUpdated(uint256 amount);

    /**
     * @dev Modifier to make a function callable only by beneficiaries.
     */
    modifier onlyBeneficiary() {
        require(_vestingSchedules[msg.sender].beneficiary == msg.sender, "MINVesting: caller is not a beneficiary");
        _;
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
        _totalReleasedAmount += amount;

        emit TokensReleased(msg.sender, amount);
        SafeERC20.safeTransfer(_token, msg.sender, amount);
    }

    /**
     * @dev Computes the amount of tokens that can be released to a beneficiary.
     * @param beneficiary The address of the beneficiary.
     * @return The amount of tokens that can be released.
     */
    function computeReleasableAmount(address beneficiary) public view virtual returns (uint256) {
        require(_vestingSchedules[beneficiary].beneficiary == beneficiary, "MINVesting: beneficiary not found");
        MINStructs.VestingSchedule storage vestingSchedule = _vestingSchedules[beneficiary];
        uint256 currentTime = getCurrentTime();
        uint256 releasable = 0;
        uint256 tgeAmount = 0;
        //calculate tge, if tge is zero, then no tokens are due
        if (vestingSchedule.tgePermille > 0) {
            tgeAmount = (vestingSchedule.totalAmount * vestingSchedule.tgePermille) / 1000;
            releasable += tgeAmount;
        }
        if (currentTime < vestingSchedule.startTimestamp + vestingSchedule.cliffDuration) {
            return releasable;
        } else if (
            currentTime >=
            vestingSchedule.startTimestamp + vestingSchedule.cliffDuration + vestingSchedule.vestingDuration
        ) {
            releasable = vestingSchedule.totalAmount - vestingSchedule.releasedAmount;
            return releasable;
        } else {
            uint256 timeFromStart = currentTime - (vestingSchedule.startTimestamp + vestingSchedule.cliffDuration);
            // Division before multiplication is intentional to floor the result.
            uint256 vestedSlicePeriods = timeFromStart / vestingSchedule.slicePeriodSeconds;
            uint256 vestedSeconds = vestedSlicePeriods * vestingSchedule.slicePeriodSeconds;
            // Compute the amount of tokens that are vested.
            uint256 vestedAmount = ((vestingSchedule.totalAmount - tgeAmount) * vestedSeconds) /
                vestingSchedule.vestingDuration;
            // Subtract the amount already released and return.
            releasable += vestedAmount - vestingSchedule.releasedAmount;
        }
        return releasable;
    }

    /**
     * @dev Returns the current time.
     * @return The current timestamp in seconds.
     */
    function getCurrentTime() internal view virtual returns (uint256) {
        return block.timestamp;
    }

    /**
     * @dev Updates the total reserved amount.
     * @param amount The amount of tokens allocated to a beneficiary.
     */
    function addToTotalReservedAmount(uint256 amount) internal {
        _totalReservedAmount += amount;
        emit TotalReservedAmountUpdated(_totalReservedAmount);
    }

    /**
     * @dev Returns the total amount of tokens that have been released.
     * @return The total amount of tokens that have been released.
     */

    function getTotalReleasedAmount() public view returns (uint256) {
        return _totalReleasedAmount;
    }

    /**
     * @dev Returns the total amount of tokens that have been reserved.
     * @return The total amount of tokens that have been reserved.
     */
    function getTotalReservedAmount() public view returns (uint256) {
        return _totalReservedAmount;
    }

    /**
     * @dev Returns the MIN token.
     * @return The MIN token.
     */
    function getToken() public view returns (IERC20) {
        return _token;
    }

    /**
     * @dev Sets the vesting schedule for a beneficiary.
     * @param vestingSchedule The vesting schedule to set.
     */
    function _setVestingSchedule(MINStructs.VestingSchedule memory vestingSchedule) internal {
        require(vestingSchedule.beneficiary != address(0), "MINVesting: beneficiary address cannot be zero");
        require(vestingSchedule.totalAmount > 0, "MINVesting: total amount must be greater than zero");
        require(vestingSchedule.slicePeriodSeconds > 0, "MINVesting: slice period must be greater than zero");
        require(
            vestingSchedule.vestingDuration > 0 &&
                vestingSchedule.slicePeriodSeconds <= vestingSchedule.vestingDuration,
            "MINVesting: vesting duration must be greater than zero and slice period"
        );

        _vestingSchedules[vestingSchedule.beneficiary] = vestingSchedule;
        emit VestingScheduleSet(vestingSchedule.beneficiary, vestingSchedule);
    }

    /**
     * @dev Removes the vesting schedule for a beneficiary.
     * @param beneficiary The address of the beneficiary.
     */
    function _removeVestingSchedule(address beneficiary) internal {
        delete _vestingSchedules[beneficiary];
    }

    /**
     * @dev Returns the vesting schedule for a beneficiary.
     * @param beneficiary The address of the beneficiary.
     * @return The vesting schedule of the beneficiary.
     */
    function getVestingSchedule(address beneficiary) public view returns (MINStructs.VestingSchedule memory) {
        return _vestingSchedules[beneficiary];
    }
}
