import hre, {ethers, artifacts, run,} from "hardhat";
import {Artifact} from "hardhat/types";
import {deployContract} from "ethereum-waffle";
import config from "../hardhat.config";
import {PancakeFactory, PancakeRouter, WBNB} from "../typechain";
import { isNil } from "lodash";

/**
 * STEP 3
 *
 * This will create the contract, verify it on BSCSCan then add the LPpair to the includes list if not already done.
 *
 * Note 1:
 */
export default async function main(): Promise<string> {

	// set the variables
	const tokenArtifactName = "PABLOAdjusted";
	const marketingWallet = "";
	const charityWallet = "";
	const distributionWallet = "";
	const burnAddress = "";

	// get creator address
	const signers = await ethers.getSigners();
	const creator = signers[0];

	// if on hardhat network, deploy a pancake swap router
	let pancakeRouter;
	if (config.defaultNetwork === "hardhat" || config.defaultNetwork === "testnet") {
		const pancakeCreator = signers[1];

		// get the artifacts
		const wbnbArtifact: Artifact = await hre.artifacts.readArtifact("WBNB")
		const pancakeFactoryArtifact: Artifact = await hre.artifacts.readArtifact("PancakeFactory")
		const pancakeRouterArtifact: Artifact = await hre.artifacts.readArtifact("PancakeRouter")

		// deploy wbnb
		console.log("deploying wbnb...");
		const wbnb = <WBNB>await deployContract(pancakeCreator, wbnbArtifact, []);
		await wbnb.deployed();

		// deploy factory
		console.log("deploying pancake factory...");
		const pancakeFactory = <PancakeFactory>await deployContract(creator, pancakeFactoryArtifact, [
			pancakeCreator.address.toString()
		]);
		await pancakeFactory.deployed();

		// deploy router
		console.log("deploying pancake router...");
		pancakeRouter = <PancakeRouter>await deployContract(pancakeCreator, pancakeRouterArtifact, [
			pancakeFactory.address.toString(),
			wbnb.address.toString()
		]);
		await pancakeRouter.deployed();
	}

	// create the artifact
	const tokenArtifactArtifact: Artifact = await hre.artifacts.readArtifact(tokenArtifactName);

	// create the token
	const tokenArtifactConstructorArguments: any[] = !isNil(pancakeRouter) ? [pancakeRouter.address.toString()] : [];
	console.log(`deploying token...`);
	const token = await deployContract(creator, tokenArtifactArtifact, tokenArtifactConstructorArguments);
	await token.deployed();
	console.log(`token deployed to: `, token.address)
	console.log(`token contract signer: `, await token.signer.getAddress());

	// verify on bscscan
	if (config.defaultNetwork !== "hardhat") {
		await run("verify:verify", {
			address: token.address,
			constructorArguments: tokenArtifactConstructorArguments,
		})
	}

	// get pair address from pancake swap factory
	// TODO this is unecessary if the lp pair is stored after creation, can just call the token contract
	// const lpPairAddress = await pancakeSwapFactoryContract.connect(creator).getPair(WBNBAddress, token.address);
	// console.log(`LP Pair address: `, lpPairAddress);

	// add pair to include list
	// TODO irrelvant if done in the constructor
	// await token.connect(creator).addToIncludeList(lpPairAddress) // TODO verify function name and parameters from critical roll

	return token.address;
}