import hre, {ethers, artifacts, run,} from "hardhat";
import {Artifact} from "hardhat/types";
import {deployContract} from "ethereum-waffle";
import {BigNumber, Contract} from "ethers";
import {formatEther, parseEther} from "ethers/lib/utils";
import pancakeRouterABI from "../abis/pancakeRouterABI";

async function main(): Promise<void> {

	// get addresses
	const signers = await ethers.getSigners();
	const owner = signers[0];
	const regularUser = signers[1];
	const liquidityHolder = signers[2];
	const creator = signers[3];
	const testBuyAndSell = signers[4];
	const marketing = signers[5];
	const charity = signers[6];
	console.table({owner, regularUser, liquidityHolder, creator, marketing, charity, testBuyAndSell})

	// get pancakeswap router
	const pancakeSwapRouterAddress = "0x9ac64cc6e4415144c455bd8e4837fea55603e5c3"; // https://pancake.kiemtienonline360.com/#/swap
	const pancakeSwapRouterContract = new Contract(pancakeSwapRouterAddress, pancakeRouterABI, liquidityHolder)

	// create the artifacts
	const tokenArtifactArtifact: Artifact = await hre.artifacts.readArtifact("Token");
	// const tokenArtifactArtifact: Artifact = await hre.artifacts.readArtifact("Token_Adjusted");

	// create the token
	const now = Date.now();
	const name = `Token-${now}`;
	const symbol = `TEST-${now}`;
	const totalSupply = parseEther("1000000000");
	const tokenArtifactConstructorArguments: any[] = [
		name,
		symbol,
		pancakeSwapRouterAddress,
		marketing.address,
		charity.address,
		totalSupply
	];
	console.log(`deploying...`);
	const token = await deployContract(creator, tokenArtifactArtifact, tokenArtifactConstructorArguments);
	await token.deployed();
	console.log(`${name} deployed to: `, token.address)
	console.log(`${name} contract signer: `, await token.signer.getAddress());
	console.log(`${name} total supply: `, totalSupply);

	// verify the token if a bscscan key is set
	let verifyPromise;
	if (process.env.ETHER_SCAN_API_KEY) {
		// don't await this, since it takes a while and can run while everything else is running
		run("verify:verify", {
			address: token.address,
			constructorArguments: tokenArtifactConstructorArguments,
		})
			.then()
			.catch(console.error)
	}

	// get the pair address
	const pairAddress = await token.connect(liquidityHolder).uniswapV2Pair();
	console.log("uniswapV2Pair address:", pairAddress);

	// transfer tokens to regular user and liquidity holder
	const userAmount = parseEther("200000000");
	const testBuyAndSellAmount = parseEther("200000000");
	const liquidityAmount = totalSupply.sub(userAmount).sub(testBuyAndSellAmount);
	const tokenSendReceipt1 = await token.connect(creator).transfer(liquidityHolder.address, liquidityAmount);
	const tokenSendReceipt2 = await token.connect(creator).transfer(regularUser.address, userAmount);
	const tokenSendReceipt3 = await token.connect(creator).transfer(testBuyAndSell.address, testBuyAndSellAmount);

	// transfer ownership
	const ownershipReceipt = await token.connect(creator).transferOwnership(owner.address);

	// wait for transactions so far
	await Promise.all([tokenSendReceipt1.wait(), tokenSendReceipt2.wait(), tokenSendReceipt3.wait(), ownershipReceipt.wait()])
	console.log("sent tokens and transferred ownership");

	// renounce exclusivity and add exclusivity to liquidity holder
	const exclusivityReceipt1 = await token.connect(owner).excludeFromFee(creator.address);
	const exclusivityReceipt2 = await token.connect(owner).excludeFromFee(liquidityHolder.address);

	// give liquidity holder the approval to the router to send the tokens
	const approvalReceipt = await token.connect(liquidityHolder).approve(pancakeSwapRouterAddress, liquidityAmount) ;

	// wait for transactions so far
	await Promise.all([exclusivityReceipt1.wait(), exclusivityReceipt2.wait(), approvalReceipt.wait()])
	console.log("removed creator from fee and approved liquidity holder");

	// add liquidity to the pool
	const liquidity = parseEther("0.1");
	await pancakeSwapRouterContract.connect(liquidityHolder).addLiquidityETH(
		token.address,
		liquidityAmount,
		liquidityAmount,
		liquidity,
		liquidityHolder.address,
		Date.now() + 1000 * 60 * 5,
		{value: liquidity}
	)
	console.log(`Added ${formatEther(liquidity)}BNB : ${formatEther(liquidityAmount)}${symbol} in liquidity.`)

	console.log(`Everything is ready for manual testing, you can try at https://pancake.kiemtienonline360.com/#/swap?outputCurrency=${token.address}. The script will continue to try and do test approve, buy and sell with address ${testBuyAndSell.address}`)

	// get the WETH address
	const wBNB = await pancakeSwapRouterContract.connect(testBuyAndSell).WETH();
	console.log("Got WETH address for wBNB", wBNB);

	// Put settings changes here, for easy testing
	// TODO this is a good spot to add interactions before the next test

	// approve the user
	const approveReceipt = await token.connect(testBuyAndSell).approve(pancakeSwapRouterAddress, testBuyAndSellAmount);
	await approveReceipt.wait()
	console.log("Approved for the sell");

	// try doing a sell
	try {
		const sellReceipt = await pancakeSwapRouterContract.connect(testBuyAndSell).swapExactTokensForETHSupportingFeeOnTransferTokens(
			testBuyAndSellAmount.div(2),
			BigNumber.from("800000000000"),
			[token.address, wBNB],
			testBuyAndSell.address,
			Date.now() + (1000 * 60 * 5)
		)
		await sellReceipt.wait();
		console.log("Sell successful!");
	} catch (err) {
		console.error("Sell failed", err);
	}

	// try doing a buy
	try {
		const buyAmount = parseEther("0.01");
		const buyAmountMin = parseEther("0.000001");
		const buyReceipt = await pancakeSwapRouterContract.connect(testBuyAndSell).swapExactETHForTokens(
			buyAmountMin,
			[wBNB, token.address],
			testBuyAndSell.address,
			Date.now() + (1000 * 60 * 5),
			{value: buyAmount}
		)
		await buyReceipt.wait();
		console.log("Buy successful!");
	} catch (err) {
		console.error("Buy failed", err);
	}

	// test a regular transfer
	try {
		const transferReceipt = await token.connect(testBuyAndSell).transfer(regularUser.address, testBuyAndSellAmount.div(2));
		await transferReceipt.wait();
		console.log("Transfer successful!");
	} catch (err) {
		console.error("Transfer failed", err);
	}

}

main()
	.then(() => process.exit(0))
	.catch((error: Error) => {
		console.error(error);
		process.exit(1);
	});
