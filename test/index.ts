import AtScaleTests from "./AtScaleTests";
import PancakeSwapTests from "./PancakeSwapTests";
import RegularUseFunctionTests from "./RegularUseFunctionTests";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {Contracts, Signers} from "../types";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import hre from "hardhat";
import {Artifact} from "hardhat/types";
import {PancakeFactory, PancakeRouter, LPBLOToken, WBNB} from "../typechain";
import DefaultValuesTests from "./DefaultValuesTests";

const {deployContract} = hre.waffle;

describe('Test Suite', function() {

	/**
	 * Set the Signers
	 */
	before(async function () {
		chai.should();
		chai.use(chaiAsPromised);
		this.signers = {} as Signers;
		const signers: SignerWithAddress[] = await hre.ethers.getSigners();
		this.signers.tokenCreator = signers[0];
		this.signers.pancakeSwapCreator = signers[1];
		this.signers.peter = signers[2];
		this.signers.christopher = signers[3];
		this.signers.khan = signers[4];
		this.signers.phil = signers[5];
		this.signers.aman = signers[6];
		this.signers.charity = signers[6];
		this.signers.marketing = signers[7];
		this.signers.burn = signers[8];
		console.table(this.signers);
	});

	/**
	 * Create the PBLOToken Contract and Pancake Swap Router, plus get relevant details
	 */
	beforeEach(async function () {
		// set the contracts
		this.contracts = {} as Contracts;

		// get the artifacts
		const wbnbArtifact: Artifact = await hre.artifacts.readArtifact("WBNB")
		const pancakeFactoryArtifact: Artifact = await hre.artifacts.readArtifact("PancakeFactory")
		const pancakeRouterArtifact: Artifact = await hre.artifacts.readArtifact("PancakeRouter")
		const tokenArtifact: Artifact = await hre.artifacts.readArtifact("LPBLOToken");

		// deploy the contracts
		this.contracts.wbnb = <WBNB>await deployContract(this.signers.pancakeSwapCreator, wbnbArtifact, []);
		this.contracts.pancakeFactory = <PancakeFactory>await deployContract(this.signers.pancakeSwapCreator, pancakeFactoryArtifact, [
			this.signers.pancakeSwapCreator.address.toString()
		]);
		this.contracts.pancakeRouter = <PancakeRouter>await deployContract(this.signers.pancakeSwapCreator, pancakeRouterArtifact, [
			this.contracts.pancakeFactory.address.toString(),
			this.contracts.wbnb.address.toString()
		]);
		this.contracts.tokenContract = <LPBLOToken>await deployContract(this.signers.tokenCreator, tokenArtifact, [
			this.signers.charity.address.toString(),
			this.signers.marketing.address.toString(),
			this.signers.burn.address.toString(),
			this.signers.burn.address.toString(), // remove this after feesCollectorWallet is removed
			this.contracts.pancakeRouter.address.toString(),
		]);

		// add the token contract to signers so it can easily be checked for its balance
		this.signers.tokenContract = this.contracts.tokenContract;

		// get total supply
		this.totalSupplyBefore = await this.contracts.tokenContract.totalSupply();

		// give tokens to burn address
		const halfOfSupply = this.totalSupplyBefore.div(2);
		await this.contracts.tokenContract.connect(this.signers.tokenCreator).transfer(this.signers.burn.address, halfOfSupply)
	})

	describe('Test the default values of the contract', DefaultValuesTests.bind(this));
	describe('Regular Use Functions Tests', RegularUseFunctionTests.bind(this));
	describe('Pancake Swap Tests', PancakeSwapTests.bind(this));
	describe('At Scale Tests', AtScaleTests.bind(this));
});