import AtScaleTests from "./AtScaleTests";
import PancakeSwapTests from "./PancakeSwapTests";
import RegularUseFunctionTests from "./RegularUseFunctionTests";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {Contracts, Signers} from "../types";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import hre from "hardhat";
import {Artifact} from "hardhat/types";
import {PancakeFactory, PancakeRouter, LPBLOToken, WBNB, PBLO2Token} from "../typechain";
import DefaultValuesTests from "./DefaultValuesTests";
import {parseEther} from "ethers/lib/utils";
import {BigNumber} from "ethers";

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
		const tokenArtifact: Artifact = await hre.artifacts.readArtifact("PBLO2Token");

		// deploy the contracts
		this.contracts.tokenContract = <PBLO2Token>await deployContract(this.signers.tokenCreator, tokenArtifact, [
			this.signers.charity.address.toString(),
			this.signers.marketing.address.toString(),
			this.signers.burn.address.toString(),
			BigNumber.from("937360403035167733937298701775585"), // this is the current balance of PBLO
			Date.now() + (1000 * 60 * 60 * 24 * 7), // 7 days
			3,
			3,
			3
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