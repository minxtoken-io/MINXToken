# ⚠️ Repository Moved (Sep 1, 2024)

As of September 1st, 2024, this project has been moved to and will be maintained at the [MINXToken](https://github.com/ModernInnovationNetwork/MINXToken) repository under the [Modern Innovation Network](https://github.com/ModernInnovationNetwork) organization.

# MIN Token Project

MIN Token project is an ERC20 based vesting project.

# Specifications

### Project Overview

On software level, MIN Token project is an ERC20 based vesting project. Given a tokenomics structure with Token Generation Events (TGE), cliff and vesting periods MIN Vesting contract will allow the vested release of MIN Token to defined addresses. These addresses will belong to project owners and will have different purposes. Two other contracts, MINPrivateSwap and MINStrategicSale will handle some amount of token sale defined in the tokenomics. Customers will be able to buy vested tokens from MINPrivateSwap at a set rate. When cliff ends and vesting period begins, customers should be able to release their tokens as they wish. MINStrategicSale will handle sales that project owners will make via legal agreements. These agreements will require the project owners to add the buyer’s address and bought amount as beneficiary to the smart contract.

### Functional, Technical Requirements

Functional and Technical Requirements can be found in the [MIN Token Project.pdf](./docs/MIN%20Token%20Project.pdf) document

# Getting Started

Recommended Node version is 20.0.0 and above.

### To get started

```bash
# clone the repo
$ git clone https://github.com/baltarifcan/MINToken.git

# change working directory
$ cd MINToken

# install dependencies
$ npm install

# compile contracts
$ npx hardhat compile

# compute tests coverage
$ npx hardhat coverage


```

### To deploy

To deploy you'll need to configure hardhat.config.ts file to add a network or use existing configuration by renaming .env.example to .env and filling in RPC url and a deployer account.

```bash
# to deploy
$ npx hardhat run scripts/deploy.ts --network mumbai

```
