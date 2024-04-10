# MIN Token Project API

## MockToken

_This contract is a mock token for testing purposes. It extends the MINToken contract._

### setToFail

```solidity
bool setToFail
```

_This variable is used to simulate transfer failures for testing purposes._

### constructor

```solidity
constructor(uint256 amountToMint) public
```

_Constructor that creates the ERC20 MIN Token._

#### Parameters

| Name         | Type    | Description                            |
| ------------ | ------- | -------------------------------------- |
| amountToMint | uint256 | The amount of token that'll be minted. |

### setToFailTransfer

```solidity
function setToFailTransfer(bool _setToFail) public
```

_This function is used to set the `setToFail` variable._

#### Parameters

| Name        | Type | Description                                 |
| ----------- | ---- | ------------------------------------------- |
| \_setToFail | bool | The new value for the `setToFail` variable. |

### transfer

```solidity
function transfer(address to, uint256 amount) public returns (bool)
```

_This function overrides the `transfer` function of the MINToken contract.
It fails if `setToFail` is true._

#### Parameters

| Name   | Type    | Description                 |
| ------ | ------- | --------------------------- |
| to     | address | The address to transfer to. |
| amount | uint256 | The amount to transfer.     |

#### Return Values

| Name | Type | Description                                               |
| ---- | ---- | --------------------------------------------------------- |
| [0]  | bool | A boolean that indicates if the operation was successful. |

## MINToken

_This contract is for a token named MIN Token with the symbol MIN.
It is an ERC20 token using OpenZeppelin's ERC20 contract._

### constructor

```solidity
constructor(uint256 amountToMint) public
```

_Constructor that gives msg.sender all of the initial tokens._

#### Parameters

| Name         | Type    | Description                                                                                                                 |
| ------------ | ------- | --------------------------------------------------------------------------------------------------------------------------- |
| amountToMint | uint256 | The amount of token that'll be minted. This value is multiplied by 10 to the power of the number of decimals the token has. |

## MINStructs

_A library for managing MIN token related structures._

### VestingSchedule

_Struct to represent a vesting schedule for MIN tokens._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

```solidity
struct VestingSchedule {
  uint256 tgePermille;
  address beneficiary;
  uint256 startTimestamp;
  uint256 cliffDuration;
  uint256 vestingDuration;
  uint256 slicePeriodSeconds;
  uint256 totalAmount;
  uint256 releasedAmount;
}
```

## MINVestingBase

_This contract handles the vesting schedule for the MIN token.
It provides functionality to set vesting schedules for beneficiaries,
compute the releasable amount of tokens for a beneficiary, and release vested tokens to a beneficiary.
The contract is Ownable, meaning it has an owner who can perform certain administrative functions._

### VestingScheduleSet

```solidity
event VestingScheduleSet(address beneficiary, struct MINStructs.VestingSchedule vestingSchedule)
```

_Emitted when a vesting schedule is set for a beneficiary._

#### Parameters

| Name            | Type                              | Description                        |
| --------------- | --------------------------------- | ---------------------------------- |
| beneficiary     | address                           | The address of the beneficiary.    |
| vestingSchedule | struct MINStructs.VestingSchedule | The vesting schedule that was set. |

### TokensReleased

```solidity
event TokensReleased(address beneficiary, uint256 amount)
```

_Emitted when tokens are released to a beneficiary._

#### Parameters

| Name        | Type    | Description                     |
| ----------- | ------- | ------------------------------- |
| beneficiary | address | The address of the beneficiary. |
| amount      | uint256 | The amount of tokens released.  |

### TotalReservedAmountUpdated

```solidity
event TotalReservedAmountUpdated(uint256 amount)
```

_Emitted when the total reserved amount is updated._

#### Parameters

| Name   | Type    | Description                    |
| ------ | ------- | ------------------------------ |
| amount | uint256 | The new total reserved amount. |

### onlyBeneficiary

```solidity
modifier onlyBeneficiary()
```

_Modifier to make a function callable only by beneficiaries._

### constructor

```solidity
constructor(contract IERC20 token) internal
```

_Sets the MIN token and the owner of the contract._

#### Parameters

| Name  | Type            | Description    |
| ----- | --------------- | -------------- |
| token | contract IERC20 | The MIN token. |

### release

```solidity
function release(uint256 amount) public
```

_Releases the vested tokens to the beneficiary._

#### Parameters

| Name   | Type    | Description                      |
| ------ | ------- | -------------------------------- |
| amount | uint256 | The amount of tokens to release. |

### computeReleasableAmount

```solidity
function computeReleasableAmount(address beneficiary) public view virtual returns (uint256)
```

_Computes the amount of tokens that can be released to a beneficiary._

#### Parameters

| Name        | Type    | Description                     |
| ----------- | ------- | ------------------------------- |
| beneficiary | address | The address of the beneficiary. |

#### Return Values

| Name | Type    | Description                                |
| ---- | ------- | ------------------------------------------ |
| [0]  | uint256 | The amount of tokens that can be released. |

### getTotalReleasedAmount

```solidity
function getTotalReleasedAmount() internal view returns (uint256)
```

_Returns the total amount of tokens that have been released._

#### Return Values

| Name | Type    | Description                                         |
| ---- | ------- | --------------------------------------------------- |
| [0]  | uint256 | The total amount of tokens that have been released. |

### getTotalReservedAmount

```solidity
function getTotalReservedAmount() internal view returns (uint256)
```

_Returns the total amount of tokens that have been reserved._

#### Return Values

| Name | Type    | Description                                         |
| ---- | ------- | --------------------------------------------------- |
| [0]  | uint256 | The total amount of tokens that have been reserved. |

### getToken

```solidity
function getToken() public view returns (contract IERC20)
```

_Returns the MIN token._

#### Return Values

| Name | Type            | Description    |
| ---- | --------------- | -------------- |
| [0]  | contract IERC20 | The MIN token. |

### getVestingSchedule

```solidity
function getVestingSchedule(address beneficiary) public view returns (struct MINStructs.VestingSchedule)
```

_Returns the vesting schedule for a beneficiary._

#### Parameters

| Name        | Type    | Description                     |
| ----------- | ------- | ------------------------------- |
| beneficiary | address | The address of the beneficiary. |

#### Return Values

| Name | Type                              | Description                              |
| ---- | --------------------------------- | ---------------------------------------- |
| [0]  | struct MINStructs.VestingSchedule | The vesting schedule of the beneficiary. |

### \_setVestingSchedule

```solidity
function _setVestingSchedule(struct MINStructs.VestingSchedule vestingSchedule) internal
```

_Sets the vesting schedule for a beneficiary._

#### Parameters

| Name            | Type                              | Description                  |
| --------------- | --------------------------------- | ---------------------------- |
| vestingSchedule | struct MINStructs.VestingSchedule | The vesting schedule to set. |

### \_removeVestingSchedule

```solidity
function _removeVestingSchedule(address beneficiary) internal
```

_Removes the vesting schedule for a beneficiary._

#### Parameters

| Name        | Type    | Description                     |
| ----------- | ------- | ------------------------------- |
| beneficiary | address | The address of the beneficiary. |

### addToTotalReservedAmount

```solidity
function addToTotalReservedAmount(uint256 amount) internal
```

_Updates the total reserved amount._

#### Parameters

| Name   | Type    | Description                                      |
| ------ | ------- | ------------------------------------------------ |
| amount | uint256 | The amount of tokens allocated to a beneficiary. |

## MINPrivateSwap

### BeneficiaryDeposit

```solidity
event BeneficiaryDeposit(address beneficiary, uint256 amount)
```

_Emitted when a beneficiary deposits swap tokens._

#### Parameters

| Name        | Type    | Description                          |
| ----------- | ------- | ------------------------------------ |
| beneficiary | address | The beneficiary address.             |
| amount      | uint256 | The amount of swap tokens deposited. |

### BeneficiaryWithdraw

```solidity
event BeneficiaryWithdraw(address beneficiary, uint256 amount)
```

_Emitted when a beneficiary withdraws swap tokens._

#### Parameters

| Name        | Type    | Description                          |
| ----------- | ------- | ------------------------------------ |
| beneficiary | address | The beneficiary address.             |
| amount      | uint256 | The amount of swap tokens withdrawn. |

### OwnerSwapTokenWithdraw

```solidity
event OwnerSwapTokenWithdraw(uint256 amount)
```

_Emitted when the owner withdraws swap tokens._

#### Parameters

| Name   | Type    | Description                          |
| ------ | ------- | ------------------------------------ |
| amount | uint256 | The amount of swap tokens withdrawn. |

### OwnerMinTokenWithdraw

```solidity
event OwnerMinTokenWithdraw(uint256 amount)
```

_Emitted when the owner withdraws MIN tokens._

#### Parameters

| Name   | Type    | Description                         |
| ------ | ------- | ----------------------------------- |
| amount | uint256 | The amount of MIN tokens withdrawn. |

### onlyAfterSaleEnd

```solidity
modifier onlyAfterSaleEnd()
```

### onlyBeforeSaleEnd

```solidity
modifier onlyBeforeSaleEnd()
```

### constructor

```solidity
constructor(contract IERC20 minToken, contract IERC20 swapToken, uint256 ratioMinToSwap, uint256 maxMinToken, struct MINStructs.VestingSchedule privateSaleVestingSchedule, uint256 saleDuration) public
```

_Constructor that initializes the contract._

#### Parameters

| Name                       | Type                              | Description                                |
| -------------------------- | --------------------------------- | ------------------------------------------ |
| minToken                   | contract IERC20                   | The MIN token.                             |
| swapToken                  | contract IERC20                   | The token to be swapped.                   |
| ratioMinToSwap             | uint256                           | The ratio of MIN tokens to swap tokens.    |
| maxMinToken                | uint256                           | The maximum amount of MIN tokens.          |
| privateSaleVestingSchedule | struct MINStructs.VestingSchedule | The vesting schedule for the private sale. |
| saleDuration               | uint256                           | The duration of the sale.                  |

### deposit

```solidity
function deposit(uint256 amount) public
```

_Allows a user to deposit a certain amount of swap tokens._

#### Parameters

| Name   | Type    | Description                           |
| ------ | ------- | ------------------------------------- |
| amount | uint256 | The amount of swap tokens to deposit. |

### withdraw

```solidity
function withdraw(uint256 amount) public
```

_Allows a user to withdraw a certain amount of swap tokens._

#### Parameters

| Name   | Type    | Description                            |
| ------ | ------- | -------------------------------------- |
| amount | uint256 | The amount of swap tokens to withdraw. |

### withdrawSwapToken

```solidity
function withdrawSwapToken(uint256 amount) public
```

_Allows the owner to withdraw a certain amount of swap tokens after the sale ends._

#### Parameters

| Name   | Type    | Description                            |
| ------ | ------- | -------------------------------------- |
| amount | uint256 | The amount of swap tokens to withdraw. |

### withdrawMinToken

```solidity
function withdrawMinToken(uint256 amount) public
```

_Allows the owner to withdraw a certain amount of MIN tokens after the sale ends._

#### Parameters

| Name   | Type    | Description                           |
| ------ | ------- | ------------------------------------- |
| amount | uint256 | The amount of MIN tokens to withdraw. |

### calculateWithdrawableMinToken

```solidity
function calculateWithdrawableMinToken() public view returns (uint256)
```

_Calculates the amount of MIN tokens that can be withdrawn._

#### Return Values

| Name | Type    | Description                                     |
| ---- | ------- | ----------------------------------------------- |
| [0]  | uint256 | The amount of MIN tokens that can be withdrawn. |

## MINStrategicSale

_This contract manages the strategic sale of MIN tokens. It allows the owner to add beneficiaries and set their vesting schedules.
It also allows the owner to withdraw MIN tokens up to the amount that is not allocated to beneficiaries._

### BeneficiaryAdded

```solidity
event BeneficiaryAdded(address beneficiary, uint256 amount)
```

_Emitted when a beneficiary is added to the strategic sale._

#### Parameters

| Name        | Type    | Description                                        |
| ----------- | ------- | -------------------------------------------------- |
| beneficiary | address | The address of the beneficiary.                    |
| amount      | uint256 | The amount of tokens allocated to the beneficiary. |

### OwnerMinTokenWithdraw

```solidity
event OwnerMinTokenWithdraw(uint256 amount)
```

_Emitted when the owner withdraws MIN tokens._

#### Parameters

| Name   | Type    | Description                     |
| ------ | ------- | ------------------------------- |
| amount | uint256 | The amount of tokens withdrawn. |

### constructor

```solidity
constructor(contract IERC20 token, struct MINStructs.VestingSchedule strategicSaleVestingSchedule) public
```

_Constructs the MINStrategicSale contract._

#### Parameters

| Name                         | Type                              | Description                                  |
| ---------------------------- | --------------------------------- | -------------------------------------------- |
| token                        | contract IERC20                   | The MIN token to be sold.                    |
| strategicSaleVestingSchedule | struct MINStructs.VestingSchedule | The vesting schedule for the strategic sale. |

### addBeneficiary

```solidity
function addBeneficiary(address beneficiary, uint256 amount) public
```

_Adds a beneficiary to the strategic sale._

#### Parameters

| Name        | Type    | Description                                        |
| ----------- | ------- | -------------------------------------------------- |
| beneficiary | address | The address of the beneficiary.                    |
| amount      | uint256 | The amount of tokens allocated to the beneficiary. |

### withdrawMinTokens

```solidity
function withdrawMinTokens(uint256 amount) public
```

_Allows the owner to withdraw MIN tokens up to the amount that is not allocated to beneficiaries._

#### Parameters

| Name   | Type    | Description                       |
| ------ | ------- | --------------------------------- |
| amount | uint256 | The amount of tokens to withdraw. |

### computeWithdrawableMintokens

```solidity
function computeWithdrawableMintokens() public view returns (uint256)
```

_Computes the amount of MIN tokens that can be withdrawn by the owner._

#### Return Values

| Name | Type    | Description                        |
| ---- | ------- | ---------------------------------- |
| [0]  | uint256 | The amount of withdrawable tokens. |

## MINVesting

_This contract handles the vesting schedule for the MIN token._

### constructor

```solidity
constructor(contract IERC20 token) public
```

_Sets the MIN token and the owner of the contract._

#### Parameters

| Name  | Type            | Description    |
| ----- | --------------- | -------------- |
| token | contract IERC20 | The MIN token. |

### addVestingSchedule

```solidity
function addVestingSchedule(struct MINStructs.VestingSchedule vestingSchedule) public
```

_Adds a vesting schedule for a beneficiary._

#### Parameters

| Name            | Type                              | Description                  |
| --------------- | --------------------------------- | ---------------------------- |
| vestingSchedule | struct MINStructs.VestingSchedule | The vesting schedule to add. |
