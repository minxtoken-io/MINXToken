// SPDX-License-Identifier: MIT
// En Garanti Teknoloji 2024

pragma solidity 0.8.20;

/**
 * @title MINPrivateSwap
 * @dev This contract is used for swapping tokens in a private sale. It inherits from the MINVestingBase contract.
 * The contract allows for depositing and withdrawing tokens, with checks for sale end times.
 * It also allows for the transformation of swap balances to vesting schedules.
 */

import "../utils/MINStructs.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../utils/MINVestingBase.sol";

contract MINPrivateSwap is MINVestingBase {
    using MINStructs for MINStructs.VestingSchedule;
    using SafeERC20 for IERC20;

    IERC20 private immutable _swapToken; // The token to be swapped
    uint256 private _totalSwapToken; // The total amount of swap tokens
    mapping(address => uint256) private _swapTokenBalances; // Mapping of swap token balances
    uint256 private immutable _saleEndTime; // The end time of the sale
    uint256 private immutable _ratioMinToSwap; // The ratio of MIN tokens to swap tokens
    uint256 private immutable _maxMinToken; // The maximum amount of MIN tokens
    MINStructs.VestingSchedule private _privateSaleVestingSchedule; // The vesting schedule for the private sale

    /**
     * @dev Emitted when a beneficiary deposits swap tokens.
     * @param beneficiary The beneficiary address.
     * @param amount The amount of swap tokens deposited.
     */
    event BeneficiaryDeposit(address indexed beneficiary, uint256 amount);
    /**
     * @dev Emitted when a beneficiary withdraws swap tokens.
     * @param beneficiary The beneficiary address.
     * @param amount The amount of swap tokens withdrawn.
     */
    event BeneficiaryWithdraw(address indexed beneficiary, uint256 amount);
    /**
     * @dev Emitted when the owner withdraws swap tokens.
     * @param amount The amount of swap tokens withdrawn.
     */
    event OwnerSwapTokenWithdraw(uint256 amount);
    /**
     * @dev Emitted when the owner withdraws MIN tokens.
     * @param amount The amount of MIN tokens withdrawn.
     */
    event OwnerMinTokenWithdraw(uint256 amount);

    modifier onlyAfterSaleEnd() {
        require(block.timestamp >= _saleEndTime, "MINPrivateSwap: sale is still ongoing");
        _;
    }

    modifier onlyBeforeSaleEnd() {
        require(block.timestamp < _saleEndTime, "MINPrivateSwap: sale has ended");
        _;
    }

    /**
     * @dev Constructor that initializes the contract.
     * @param minToken The MIN token.
     * @param swapToken The token to be swapped.
     * @param ratioMinToSwap The ratio of MIN tokens to swap tokens.
     * @param maxMinToken The maximum amount of MIN tokens.
     * @param privateSaleVestingSchedule The vesting schedule for the private sale.
     * @param saleDuration The duration of the sale.
     */
    constructor(
        IERC20 minToken,
        IERC20 swapToken,
        uint256 ratioMinToSwap,
        uint256 maxMinToken,
        MINStructs.VestingSchedule memory privateSaleVestingSchedule,
        uint256 saleDuration
    ) MINVestingBase(minToken) {
        require(address(swapToken) != address(0), "MINPrivateSwap: swap token address cannot be 0");
        _swapToken = swapToken;
        _saleEndTime = block.timestamp + saleDuration;
        _ratioMinToSwap = ratioMinToSwap;
        _maxMinToken = maxMinToken;
        _privateSaleVestingSchedule = privateSaleVestingSchedule;
    }

    /**
     * @dev Allows a user to deposit a certain amount of swap tokens.
     * @param amount The amount of swap tokens to deposit.
     */
    function deposit(uint256 amount) public onlyBeforeSaleEnd {
        require(
            (((_swapToken.balanceOf(address(this)) + amount) * 100) / _ratioMinToSwap) <= _maxMinToken,
            "MINPrivateSwap: not enough MIN tokens to buy for the swap tokens"
        );
        require(amount > 0, "MINPrivateSwap: amount must be greater than 0");

        uint256 swapTokenBalance = _swapTokenBalances[msg.sender];
        _swapTokenBalances[msg.sender] = swapTokenBalance + amount;
        _totalSwapToken += amount;
        _updateBeneficiaryVestedAmount(msg.sender, swapTokenBalance + amount);

        emit BeneficiaryDeposit(msg.sender, amount);
        SafeERC20.safeTransferFrom(_swapToken, msg.sender, address(this), amount);
    }

    /**
     * @dev Allows a user to withdraw a certain amount of swap tokens.
     * @param amount The amount of swap tokens to withdraw.
     */
    function withdraw(uint256 amount) public onlyBeforeSaleEnd {
        require(_swapTokenBalances[msg.sender] >= amount, "MINPrivateSwap: insufficient balance");
        uint256 swapTokenBalance = _swapTokenBalances[msg.sender];
        _swapTokenBalances[msg.sender] = swapTokenBalance - amount;
        _totalSwapToken -= amount;
        _updateBeneficiaryVestedAmount(msg.sender, swapTokenBalance - amount);

        emit BeneficiaryWithdraw(msg.sender, amount);
        SafeERC20.safeTransfer(_swapToken, msg.sender, amount);
    }

    /**
     * @dev Allows the owner to withdraw a certain amount of swap tokens after the sale ends.
     * @param amount The amount of swap tokens to withdraw.
     */
    function withdrawSwapToken(uint256 amount) public onlyOwner onlyAfterSaleEnd {
        require(amount <= _swapToken.balanceOf(address(this)), "MINPrivateSwap: Insufficient balance");

        emit OwnerSwapTokenWithdraw(amount);
        SafeERC20.safeTransfer(_swapToken, msg.sender, amount);
    }

    /**
     * @dev Allows the owner to withdraw a certain amount of MIN tokens after the sale ends.
     * @param amount The amount of MIN tokens to withdraw.
     */
    function withdrawMinToken(uint256 amount) public onlyOwner onlyAfterSaleEnd {
        require(amount <= calculateWithdrawableMinToken(), "MINPrivateSwap: Not enough MIN tokens to withdraw");

        emit OwnerMinTokenWithdraw(amount);
        SafeERC20.safeTransfer(getToken(), msg.sender, amount);
    }

    /**
     * @dev Calculates the amount of MIN tokens that can be withdrawn.
     * @return The amount of MIN tokens that can be withdrawn.
     */
    function calculateWithdrawableMinToken() public view returns (uint256) {
        if (block.timestamp < _saleEndTime) return 0;

        return getToken().balanceOf(address(this)) - ((_totalSwapToken * 100) / _ratioMinToSwap);
    }

    function _updateBeneficiaryVestedAmount(address beneficiary, uint256 swapTokenBalance) private {
        MINStructs.VestingSchedule memory vestingSchedule = MINStructs.VestingSchedule({
            tgePermille: 0,
            beneficiary: beneficiary,
            startTimestamp: _privateSaleVestingSchedule.startTimestamp,
            cliffDuration: _privateSaleVestingSchedule.cliffDuration,
            vestingDuration: _privateSaleVestingSchedule.vestingDuration,
            slicePeriodSeconds: _privateSaleVestingSchedule.slicePeriodSeconds,
            totalAmount: 0,
            releasedAmount: 0
        });
        if (swapTokenBalance > 0) {
            vestingSchedule.totalAmount = ((swapTokenBalance * 100) / _ratioMinToSwap);
        }
        if (vestingSchedule.totalAmount > 0) {
            _setVestingSchedule(vestingSchedule);
        } else {
            _removeVestingSchedule(beneficiary);
        }
    }
}
