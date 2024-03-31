// SPDX-License-Identifier: MIT
// En Garanti Teknoloji 2024
pragma solidity 0.8.20;

import "../token/MINToken.sol";

/**
 * @title MockToken
 * @dev This contract is a mock token for testing purposes. It extends the MINToken contract.
 */
contract MockToken is MINToken {
    /**
     * @dev This variable is used to simulate transfer failures for testing purposes.
     */
    bool public setToFail = false;

    /**
     * @dev Constructor that creates the ERC20 MIN Token.
     * @param amountToMint The amount of token that'll be minted.
     */
    constructor(uint256 amountToMint) MINToken(amountToMint) {
        _mint(msg.sender, amountToMint * 10 ** decimals());
    }

    /**
     * @dev This function is used to set the `setToFail` variable.
     * @param _setToFail The new value for the `setToFail` variable.
     */
    function setToFailTransfer(bool _setToFail) public {
        setToFail = _setToFail;
    }

    /**
     * @dev This function overrides the `transfer` function of the MINToken contract.
     * It fails if `setToFail` is true.
     * @param to The address to transfer to.
     * @param amount The amount to transfer.
     * @return A boolean that indicates if the operation was successful.
     */
    function transfer(address to, uint256 amount) public override returns (bool) {
        require(!setToFail, "MockToken: Transfer failed");
        return super.transfer(to, amount);
    }
}
