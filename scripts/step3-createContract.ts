import hre, {ethers, artifacts, run,} from "hardhat";
import {Artifact} from "hardhat/types";
import {deployContract} from "ethereum-waffle";
import config from "../hardhat.config";
import {PABLO, PancakeFactory, PancakeRouter, WBNB} from "../typechain";
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
	const tokenArtifactName = "PABLO";
	const marketingWallet = "0x9656B113b4f54102d232FA5D87D1F13f5c522DAC";
	const charityWallet = "0xf9693E7CC15bE6CEBFdCE8F78c82a495c68FDD87";
	const equalizerWallet = "0x7ABb1a8bCee854Cd7eC51f4192Ac05FB40748D2d";
	const burnWallet = "0x758075dabe5cab30c3fb3c3eb25273a1c8772f73";
	const owner = "0x91f9B1Bd66eCD9479592A77E577ab21feb601FEC";

	// get creator address
	const signers = await ethers.getSigners();
	const creator = signers[0];

	// if on hardhat network, deploy a pancake swap router
	let pancakeRouter;
	if (config.defaultNetwork === "hardhat") {
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

	// get the artifact for the token
	const tokenArtifactArtifact: Artifact = await hre.artifacts.readArtifact(tokenArtifactName);

	// create the token
	const tokenArtifactConstructorArguments: any[] = !isNil(pancakeRouter) ? [pancakeRouter.address.toString()] : [];
	console.log(`deploying token...`, tokenArtifactConstructorArguments);
	const token = <PABLO>await deployContract(creator, tokenArtifactArtifact, tokenArtifactConstructorArguments);
	await token.deployed();
	console.log(`token deployed to: `, token.address)
	console.log(`token contract signer: `, await token.signer.getAddress());

	// verify on bscscan
	if (config.defaultNetwork !== "hardhat" && process.env.ETHER_SCAN_API_KEY) {
		// try {
		// 	console.log("verifying");
		// 	await run("verify:verify", {
		// 		address: token.address,
		// 		constructorArguments: tokenArtifactConstructorArguments,
		// 	})
		// } catch (err) {
		// 	console.error("verify error", err)
		// }
	}

	// get pair address from token
	console.log(`getting the LP Pair...`)
	const lpPairAddress = await token.connect(creator).uniswapV2Pair();

	// exclude lp pair from reward
	console.log(`excluding the LP Pair from rewards (${lpPairAddress})...`)
	const excludeLPairReceipt = await token.connect(creator).excludeFromReward(lpPairAddress);
	await excludeLPairReceipt.wait();

	// set the charity wallet
	console.log("setting the charity wallet...")
	const setCharityAddressReceipt = await token.connect(creator).setCharityAddress(charityWallet);
	await setCharityAddressReceipt.wait();

	// set the marketing wallet
	console.log("setting the marketing wallet...")
	const setMarketingAddressReceipt = await token.connect(creator).setMarketingAddress(marketingWallet);
	await setMarketingAddressReceipt.wait();

	// set the equalizer wallet
	console.log("setting the equalizer wallet...")
	const setEqualizerAddressReceipt = await token.connect(creator).setEqualizerAddress(equalizerWallet);
	await setEqualizerAddressReceipt.wait();

	// set the equalizer wallet
	console.log("setting the burn wallet...")
	const setBurnAddressReceipt = await token.connect(creator).setControlledBurnAddress(burnWallet);
	await setBurnAddressReceipt.wait();

	return token.address;
}
