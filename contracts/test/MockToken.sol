// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MINPrivateSwap
 */
contract MockToken is ERC20 {
    bool public setToFail = false;

    /**
     * @dev Creates the ERC20 MIN Token
     * @param amountToMint The amount of token that'll be minted.
     */
    constructor(uint256 amountToMint) ERC20("Mock Token", "MOCK") {
        _mint(msg.sender, amountToMint * 10 ** decimals());
    }

    function setToFailTransfer(bool _setToFail) public {
        setToFail = _setToFail;
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        require(!setToFail, "Transfer failed");
        return super.transfer(to, amount);
    }
}
