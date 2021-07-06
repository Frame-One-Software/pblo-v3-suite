import {Contracts} from "../types";
import {Artifact} from "hardhat/types";
import hre from "hardhat";
import {LPBLOToken, PancakeFactory, PancakeRouter, WBNB} from "../typechain";

const {deployContract} = hre.waffle;

export default function PancakeSwapTests() {

	/**
	 * Deploy a pancake swap router and get necessary variables
	 */
	beforeEach(async function () {
		// get the artifacts
		const wbnbArtifact: Artifact = await hre.artifacts.readArtifact("WBNB")
		const pancakeFactoryArtifact: Artifact = await hre.artifacts.readArtifact("PancakeFactory")
		const pancakeRouterArtifact: Artifact = await hre.artifacts.readArtifact("PancakeRouter")

		// deploy the contracts
		this.contracts.wbnb = <WBNB>await deployContract(this.signers.pancakeSwapCreator, wbnbArtifact, []);
		this.contracts.pancakeFactory = <PancakeFactory>await deployContract(this.signers.pancakeSwapCreator, pancakeFactoryArtifact, [
			this.signers.pancakeSwapCreator.address.toString()
		]);
		this.contracts.pancakeRouter = <PancakeRouter>await deployContract(this.signers.pancakeSwapCreator, pancakeRouterArtifact, [
			this.contracts.pancakeFactory.address.toString(),
			this.contracts.wbnb.address.toString()
		]);
	})

}