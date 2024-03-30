// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MINToken is ERC20 {
    constructor(uint256 amountToMint) ERC20("MIN Token", "MIN") {
        _mint(msg.sender, amountToMint * 10 ** decimals());
    }
}
