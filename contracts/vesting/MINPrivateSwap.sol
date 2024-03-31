// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title MINPrivateSwap
 */

import "../utils/MINStructs.sol";

import "../utils/MINVestingBase.sol";

contract MINPrivateSwap is MINVestingBase {
    using MINStructs for MINStructs.VestingSchedule;
    IERC20 private immutable _swapToken;

    address[] private _beneficiaries;
    mapping(address => bool) private _addedToBeneficiaries;
    mapping(address => uint256) private _swapTokenBalances;
    uint256 private immutable _saleEndTime;
    uint256 private immutable _ratioMinToSwap;
    uint256 private immutable _maxMinToken;
    MINStructs.VestingSchedule private _privateSaleVestingSchedule;

    constructor(
        IERC20 minToken,
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

    function deposit(uint256 amount) public onlyBeforeSaleEnd {
        require(
            (((_swapToken.balanceOf(address(this)) + amount) * 100) / _ratioMinToSwap) <=
                _maxMinToken,
            "MINPrivateSwap: not enough MIN tokens to buy for the swap tokens"
        );
        require(amount > 0, "MINPrivateSwap: amount must be greater than 0");
        if (_swapTokenBalances[msg.sender] == 0 && !_addedToBeneficiaries[msg.sender]) {
            _beneficiaries.push(msg.sender);
            _addedToBeneficiaries[msg.sender] = true;
        }
        _swapTokenBalances[msg.sender] += amount;

        require(_swapToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    }

    function withdraw(uint256 amount) public onlyBeforeSaleEnd {
        require(_swapTokenBalances[msg.sender] >= amount, "MINPrivateSwap: insufficient balance");
        _swapTokenBalances[msg.sender] -= amount;
        require(_swapToken.transfer(msg.sender, amount), "Transfer failed");
    }

    function withdrawSwapToken(uint256 amount) public onlyOwner onlyAfterSaleEnd {
        require(amount <= _swapToken.balanceOf(address(this)), "Insufficient balance");
        require(
            (_swapToken.balanceOf(address(this)) * 100) / _ratioMinToSwap <=
                getToken().balanceOf(address(this)),
            "Can't withdraw swap tokens before sufficient MIN tokens are deposited"
        );
        _transformSwapBalancesToVestingSchedules();
        require(_swapToken.transfer(msg.sender, amount), "Transfer failed");
    }

    function withdrawMinToken(uint256 amount) public onlyOwner onlyAfterSaleEnd {
        require(
            amount <= getToken().balanceOf(address(this)) - calculateWithdrawableMinToken(),
            "Not enough MIN tokens to withdraw"
        );
        getToken().transfer(msg.sender, amount);
    }

    function calculateWithdrawableMinToken() public view returns (uint256) {
        if (block.timestamp < _saleEndTime) return 0;
        uint256 totalSwapToken = 0;
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            totalSwapToken += _swapTokenBalances[_beneficiaries[i]];
        }
        return ((totalSwapToken * 100) / _ratioMinToSwap);
    }

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
