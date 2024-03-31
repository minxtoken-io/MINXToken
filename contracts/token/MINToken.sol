// SPDX-License-Identifier: MIT
// En Garanti Teknoloji 2024
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MINPrivateSwap
 * @dev This contract is for a token named MIN Token with the symbol MIN.
 * It is an ERC20 token using OpenZeppelin's ERC20 contract.
 */
contract MINToken is ERC20 {
    /**
     * @dev Constructor that gives msg.sender all of the initial tokens.
     * @param amountToMint The amount of token that'll be minted.
     * This value is multiplied by 10 to the power of the number of decimals the token has.
     */
    constructor(uint256 amountToMint) ERC20("MIN Token", "MIN") {
        _mint(msg.sender, amountToMint * 10 ** decimals());
    }
}
