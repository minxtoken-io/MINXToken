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

import "../utils/MINVestingBase.sol";

contract MINPrivateSwap is MINVestingBase {
    using MINStructs for MINStructs.VestingSchedule;

    IERC20 private immutable _swapToken; // The token to be swapped
    address[] private _beneficiaries; // List of beneficiaries
    mapping(address => bool) private _addedToBeneficiaries; // Mapping to check if a beneficiary is added
    mapping(address => uint256) private _swapTokenBalances; // Mapping of swap token balances
    uint256 private immutable _saleEndTime; // The end time of the sale
    uint256 private immutable _ratioMinToSwap; // The ratio of MIN tokens to swap tokens
    uint256 private immutable _maxMinToken; // The maximum amount of MIN tokens
    MINStructs.VestingSchedule private _privateSaleVestingSchedule; // The vesting schedule for the private sale

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
        MINToken minToken,
        IERC20 swapToken,
        uint256 ratioMinToSwap,
        uint256 maxMinToken,
        MINStructs.VestingSchedule memory privateSaleVestingSchedule,
        uint256 saleDuration
    ) MINVestingBase(minToken) {
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
        if (_swapTokenBalances[msg.sender] == 0 && !_addedToBeneficiaries[msg.sender]) {
            _beneficiaries.push(msg.sender);
            _addedToBeneficiaries[msg.sender] = true;
        }
        _swapTokenBalances[msg.sender] += amount;

        try _swapToken.transferFrom(msg.sender, address(this), amount) returns (bool) {} catch {
            revert("MINPrivateSwap: Transfer failed");
        }
    }

    /**
     * @dev Allows a user to withdraw a certain amount of swap tokens.
     * @param amount The amount of swap tokens to withdraw.
     */
    function withdraw(uint256 amount) public onlyBeforeSaleEnd {
        require(_swapTokenBalances[msg.sender] >= amount, "MINPrivateSwap: insufficient balance");
        _swapTokenBalances[msg.sender] -= amount;
        try _swapToken.transfer(msg.sender, amount) returns (bool) {} catch {
            revert("MINPrivateSwap: Transfer failed");
        }
    }

    /**
     * @dev Allows the owner to withdraw a certain amount of swap tokens after the sale ends.
     * @param amount The amount of swap tokens to withdraw.
     */
    function withdrawSwapToken(uint256 amount) public onlyOwner onlyAfterSaleEnd {
        require(amount <= _swapToken.balanceOf(address(this)), "MINPrivateSwap: Insufficient balance");
        require(
            (_swapToken.balanceOf(address(this)) * 100) / _ratioMinToSwap <= getToken().balanceOf(address(this)),
            "MINPrivateSwap: Can't withdraw swap tokens before sufficient MIN tokens are deposited"
        );
        _transformSwapBalancesToVestingSchedules();
        try _swapToken.transfer(msg.sender, amount) returns (bool) {} catch {
            revert("MINPrivateSwap: Transfer failed");
        }
    }

    /**
     * @dev Allows the owner to withdraw a certain amount of MIN tokens after the sale ends.
     * @param amount The amount of MIN tokens to withdraw.
     */
    function withdrawMinToken(uint256 amount) public onlyOwner onlyAfterSaleEnd {
        require(
            amount <= getToken().balanceOf(address(this)) - calculateWithdrawableMinToken(),
            "MINPrivateSwap: Not enough MIN tokens to withdraw"
        );
        try getToken().transfer(msg.sender, amount) returns (bool) {} catch {
            revert("MINPrivateSwap: Transfer failed");
        }
    }

    /**
     * @dev Calculates the amount of MIN tokens that can be withdrawn.
     * @return The amount of MIN tokens that can be withdrawn.
     */
    function calculateWithdrawableMinToken() public view returns (uint256) {
        if (block.timestamp < _saleEndTime) return 0;
        uint256 totalSwapToken = 0;
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            totalSwapToken += _swapTokenBalances[_beneficiaries[i]];
        }
        return ((totalSwapToken * 100) / _ratioMinToSwap);
    }

    /**
     * @dev Transforms the swap token balances to vesting schedules.
     */
    function _transformSwapBalancesToVestingSchedules() private {
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            address beneficiary = _beneficiaries[i];
            uint256 swapTokenBalance = _swapTokenBalances[beneficiary];
            if (swapTokenBalance > 0) {
                MINStructs.VestingSchedule memory vestingSchedule = MINStructs.VestingSchedule({
                    tgePermille: 0,
                    beneficiary: beneficiary,
                    startTimestamp: _privateSaleVestingSchedule.startTimestamp,
                    cliffDuration: _privateSaleVestingSchedule.cliffDuration,
                    vestingDuration: _privateSaleVestingSchedule.vestingDuration,
                    slicePeriodSeconds: _privateSaleVestingSchedule.slicePeriodSeconds,
                    totalAmount: ((swapTokenBalance * 100) / _ratioMinToSwap),
                    releasedAmount: 0
                });
                setVestingSchedule(vestingSchedule);
            }
        }
    }

    modifier onlyAfterSaleEnd() {
        require(block.timestamp >= _saleEndTime, "MINPrivateSwap: sale is still ongoing");
        _;
    }

    modifier onlyBeforeSaleEnd() {
        require(block.timestamp < _saleEndTime, "MINPrivateSwap: sale has ended");
        _;
    }
}
