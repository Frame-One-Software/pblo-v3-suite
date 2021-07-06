# Safemoon Fork & Pancake Swap Bounty

The following repo are instructions and resources for a bounty. As of June 25th, 2021 the bounty is set at 3 BNB.

In the contracts folder of this project is a filed named `Token.sol`. It is modified safemoon fork, that has an additional
burn and tax for two other wallets `charity` and `marketing`.

Currently this token is live on mainNet and there is no way to update it. There is a bug while using the `swapExactTokensForETHSupportingFeeOnTransferTokens` function on the pancakeswap router. it will result in a `transferHelper: TRANSFER_FROM_FAILED` error.

Though assistance from the PancakeSwap Slack, we were able to identify that the `_takeMarketing` and `_takeCharity` are a part of the problem.

If we change those functions from...

```solidity
    function _takeMarketing(uint256 tMarketing) private {
        if(tMarketing == 0) return;
        _transfer(_msgSender(), _marketingWallet, tMarketing);
    }

    function _takeCharity(uint256 tCharity) private {
        if(tCharity == 0) return;
        _transfer(_msgSender(), _charityWallet, tCharity);
```

to

```solidity
    function _takeMarketing(uint256 tMarketing) private {
        uint256 currentRate =  _getRate();
        uint256 rMarketing = tMarketing.mul(currentRate);
        _rOwned[address(_marketingWallet)] = _rOwned[address(_marketingWallet)].add(rMarketing);
        if(_isExcluded[address(_marketingWallet)])
            _tOwned[address(_marketingWallet)] = _tOwned[address(_marketingWallet)].add(tMarketing);
    }

    function _takeCharity(uint256 tCharity) private {
        uint256 currentRate =  _getRate();
        uint256 rCharity = tCharity.mul(currentRate);
        _rOwned[address(_charityWallet)] = _rOwned[address(_charityWallet)].add(rCharity);
        if(_isExcluded[address(_charityWallet)])
            _tOwned[address(_charityWallet)] = _tOwned[address(_charityWallet)].add(tCharity);
    }
```

then the problem is resolved. However, as mentioned before this token is in production and we can no longer change the source. We would airdrop a new token with the fix if we could, but currently a majority of the liquidity is locked and thus we couldn't move it. Right now we have disabled the tax in production by excluding the LP tokens of the pool, which allows buying and selling, but the tax isn't enforced.

Anyone whom is able to come up with a solution so that we may charge our taxes and allow transfering, buying, selling, and adding to liquidity on pancake swap will receive the bounty. The bounty is subject to approval from our team, we are very open to any collaboration and would gladly give the bounty to anyone who is able to come up with a solution that will work.

# Using the Deploy Script
In order to have rapid testing on testnet, there is a `deploy.ts` file in the `/scripts` directory. If you make a file called `.env` in the route and provide the variables exampled in `.env.example` then you can run `npm run deploy:network testnet`. This file will deploy the token, add liquidity, verify the contract (optional), transfer some test tokens to your 2nd address, and also run a test buy, sell and transfer. You will need some test BNB from the faucet on your first 5 addresses from your mnemonic for it to run. There is an ideal spot marked by a `//TODO` that would be a good place to make any changes or interact with the chain before the test runs. You may also manually test and make changes. The script will print out all relevant urls and addresses as needed.

# The Contracts

There are two contracts in the `/contracts` directory...
- `Token.sol`
- `Token_Adjusted.sol`

The difference between these two contracts is the `_takeMarketing` and `_takeCharity` functions. The `Token_Adjusted.sol` has the fix in it, while `Token.sol` does not. If you would like to check out the adjusted version, you can uncomment/comment the `readArtifact` lines in `deploy.ts`. We are only looking for solutions on the `Token.sol` file, since this is the one in production.

```typescript
    // create the artifacts
	const tokenArtifactArtifact: Artifact = await hre.artifacts.readArtifact("Token");
	// const tokenArtifactArtifact: Artifact = await hre.artifacts.readArtifact("Token_Adjusted");
```

# Contact
Any contact can be done through the issues on the repo or by emailing _Mr Sukhvinder Singh Cheema_ at `Pablotoken@protonmail.com`. 

Please do not contact Frame One Software for this issue, they are merely assisting with the process and helping resolve the issues.