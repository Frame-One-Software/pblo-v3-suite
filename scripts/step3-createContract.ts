import hre, {ethers, artifacts, run,} from "hardhat";
import {Artifact} from "hardhat/types";
import {deployContract} from "ethereum-waffle";
import {BigNumber, Contract} from "ethers";
import pancakeRouterABI from "../abis/pancakeRouterABI";
import pancakeFactoryABI from "../abis/pancakeFactoryABI";

/**
 * STEP 3
 *
 * This will create the contract, verify it on BSCSCan then add the LPpair to the includes list if not already done.
 */
async function main(): Promise<void> {

	// set the variables
	const tokenArtifactName = "Token";
	const name = "";
	const symbol = "";
	const totalSupply = BigNumber.from(1);
	const pancakeSwapV2Router = "";
	const marketingWallet = "";
	const charityWallet = "";
	const distributionWallet = "";
	const burnAddress = "";
	const pancakeSwapRouterAddress = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73"; // mainnet

	// get creator address
	const signers = await ethers.getSigners();
	const creator = signers[0];

	// get pancakeswap contracts and WBNB address
	const pancakeSwapRouterContract = new Contract(pancakeSwapRouterAddress, pancakeRouterABI, creator);
	const pancakeSwapFactoryAddress = await pancakeSwapRouterContract.connect(creator).factory();
	const WBNBAddress = await pancakeSwapRouterContract.connect(creator).WETH();
	const pancakeSwapFactoryContract = new Contract(pancakeSwapFactoryAddress, pancakeFactoryABI, creator);

	// create the artifact
	const tokenArtifactArtifact: Artifact = await hre.artifacts.readArtifact(tokenArtifactName);

	// create the token
	const tokenArtifactConstructorArguments: any[] = [
		// TODO verify the constructor arguments
		name,
		symbol,
		totalSupply,
		pancakeSwapV2Router,
		marketingWallet,
		charityWallet,
		distributionWallet,
		burnAddress,
	];
	console.log(`deploying...`);
	const token = await deployContract(creator, tokenArtifactArtifact, tokenArtifactConstructorArguments);
	await token.deployed();
	console.log(`token deployed to: `, token.address)
	console.log(`token contract signer: `, await token.signer.getAddress());

	// verify on bscscan
	await run("verify:verify", {
		address: token.address,
		constructorArguments: tokenArtifactConstructorArguments,
	})

	// get pair address from pancake swap factory
	// TODO this is unecessary if the lp pair is stored after creation, can just call the token contract
	const lpPairAddress = await pancakeSwapFactoryContract.connect(creator).getPair(WBNBAddress, token.address);
	console.log(`LP Pair address: `, lpPairAddress);

	// add pair to include list
	// TODO irrelvant if done in the constructor
	await token.connect(creator).addToIncludeList(lpPairAddress) // TODO verify function name and parameters from critical roll
}

main()
	.then(() => process.exit(0))
	.catch((error: Error) => {
		console.error(error);
		process.exit(1);
	});
