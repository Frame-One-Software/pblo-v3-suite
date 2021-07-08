# Deployment Steps
Before Friday, everybody needs to read over this document and know what is happening at each step.

## Step 1 (Get Real Balances 🏦)
We will generate a list of holders from BSCScan, then we will run `npm run step1`. This will get the real balances of all users and save to a file

## Step 2 (Adjust CSV 🧮)
This CSV needs to be adjusted to ignore certain addresses, add the bonus and make sure the liqudityHolder gets the same number of tokens that are in the LP Token. This can be done by adjusting the names of the variables to the file outputs from step 1 and then running `npm run step2`. 

## Step 3 (Create Contract 📝)
This will make the contract, grabbing all necessary variables. Then it will add the proper addresses to the include and exclude functions. These include the pancakeRouter, LP Pair to be included. On the exclude list, we need to confirm marketing, charity and equalizer will be in there. We will need to manually add the liquidity holder though as we don't want a tax when we transfer liquidity. This can all be done by running `npm run step3`. Once this step is done it will output a new totalSupply this should be passed into the contract so it knows how many tokens to mint.

## Step 4 (Airdrop 💸)
This is the expensive step! An airdrop will commence reading the file from step 2. It will batch send out transfers to each of the users in the list. Whomever is running this script. It is vital they have enough BNB to make all the transactions. This can be run with `npm run step4`

## Step 5 (Transfer Ownership 🤝)
Aman should be the new owner now that the dev has created everything. Run the script to transfer ownership to Aman. From this point on, any changes must be done by Aman. This step can be run with `npm run step5` or just use the contract on BSCScan

## Step 6 (Check For Mistakes ❌️⭕)
**This step and the next steps are manual**. Step 5 is a sanity check. We just ran the airdrop, but it is not too late to turn back if something went wrong. We might be out the money for the airdrop, but we need to check everything before continuing to step 6 (after step 6 there is no going back). This is a last chance to do some mainnet testing of the token, I suggest we ALL do the following...
- [ ] check your balances are 20% higher than what they are (you need to check the getBalance function, BSCScan has the wrong numbers on the holders page)
- [ ] Make a transfer and see that it doesn't crash and there are no taxes
- [ ] Add some liquidity to the pool
- [ ] Try to buy
- [ ] Try to sell
- [ ] Determine what the slippage needs to be and if it is appropriate
- [ ] Make sure there are taxes on buy and sell
- [ ] Make sure there are no taxes on peer to peer
- [ ] Remove some liquidity from the pool
- [ ] Check and see that the marketing, charity and equalizer are receiving BNB
- [ ] Check and see there are burns that are happening
- [ ] Check and see if you received rewards when someone else buys and sells
- [ ] **ANYTHING ELSE YOU CAN THINK OF DO NOW!**

## Step 7 (Move Liquidity 🦄)
Aman will go into the burn, marketing and charity wallet. He will sell all of his tokens in order to buyout all of the BNB in the liquidity Pool. He will then transfer this BNB to the liquidity wallet. This wallet will have a large amount of PBLO on it, he will put all of the BNB and PBLO into the liqudity of the new contract address

## Step 8 (Check Again 💩)
No time for celebrating early, go through step 5 all over again. Everyone needs to sign off that things are working. Extra things to check in addition to the list from above are...
- [ ] Check PooCoin prices, make sure the market cap is represented and is close to what the old value. It won't be exact because we inflated quite a bit with bonuses
- [ ] Check the liquidity holder has their LP tokens
- [ ] Check the transactions with the liquidity holder did not get taxed

## Step 9 (Inform The Community 🎤)
Once we are comfortable, we can update the charts on the community and post the new address. People might freak out because literally all the liquidity had moved and they might be trying to jump ship. Let them know they have been airdropped the new token and the liquidity is just in a different Pair

## Step 10 (Sleep & Let Some Time Pass 💤)
Now I guarantee its going to be nearly the next morning by this point and we will have stayed up all night once again. There are still more steps to do, but at this point we are safe, there should be little to no concerns and we can go to bed.

## Step 11 (Lock Burn Wallet 🔥)
Last time we jumped the gun a little too quick on this step. We don't want to lock anything and then there be an issue like last time. I want to make sure we have no issues on the token before we continue with this step. Once we are 100% okay with the token, Aman should lock the burn wallet in DXLock. After this is done, we need to go to the contract page and transfer the burn wallet address to the DXLock address. This way there will still be burns, but the funds won't be accessible anymore.

## Step 12 (Lock the LP Tokens 🔒)
Aman should log into the liquidity holder wallet and lock the LP Tokens into DXLock.

## Step 13 (Celebrate 🥳)
Everyone should pat themselves on the back at this point. The last 3 weeks have been a nightmare of technical issues. Everything is now done and we are smooth sailing. The token is out, its locked, we are ready to move forward with other parts of the project including making the wallet, the pablo mobile app, getting on hotbit, ramping up the marketing, and much much more. Congratulations, third time is the charm!




