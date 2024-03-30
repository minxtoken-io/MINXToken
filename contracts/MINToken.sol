// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MINPrivateSwap
 */
contract MINToken is ERC20 {
    constructor(uint256 amountToMint) ERC20("MIN Token", "MIN") {
        _mint(msg.sender, amountToMint * 10 ** decimals());
    }
}
