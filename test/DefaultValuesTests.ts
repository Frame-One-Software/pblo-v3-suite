import { expect } from "chai";
import getDetailsOfSigners from "./utils/getDetailsOfSigners";
import {BigNumber} from "ethers";
import {isInExcludeList, isInIncludeList} from "./utils/easyExcludeAndInclude";

export default function DefaultValuesTests() {
	it("check the default state of the contract", async function () {
		// check the charity wallet
		const charityWallet = await this.contracts.tokenContract._charityWallet();
		expect(charityWallet).to.be.equal(this.signers.charity.address.toString())

		// check the marketing wallet
		const marketingWallet = await this.contracts.tokenContract._marketingWallet();
		expect(marketingWallet).to.be.equal(this.signers.marketing.address.toString())

		// check the rewards exclusions are proper
		const burnWallet = await this.contracts.tokenContract._burnWallet();
		expect(burnWallet).to.be.equal(this.signers.burn.address.toString())

		// check the total supply
		expect(this.totalSupplyBefore).to.equal(this.totalSupplyConstructor);

		// check the name
		const name = await this.contracts.tokenContract.name();
		expect(name).to.equal(this.name);

		// check the symbol
		const symbol = await this.contracts.tokenContract.symbol();
		expect(symbol).to.equal(this.symbol);

		// check the decimals
		const decimals = await this.contracts.tokenContract.decimals();
		expect(decimals).to.equal(18);

		// check the burn fee
		const burnFee = await this.contracts.tokenContract._burnFee();
		expect(burnFee).to.equal(this.burnFeeConstructor);

		// check the charity fee
		const charityFee = await this.contracts.tokenContract._charityFee();
		expect(charityFee).to.equal(this.charityFeeConstructor);

		// check the marketing fee
		const marketingFee = await this.contracts.tokenContract._marketingFee();
		expect(marketingFee).to.equal(this.marketingFeeConstructor);
	});

	it ("check the default balance of everyone is 0 except for the creator and the burn address", async function() {
		const details = await getDetailsOfSigners.bind(this)();
		const halfOfSupply = this.totalSupplyBefore.div(2); // to check the owner and the burn
		const keys = Object.keys(details);
		for (const key of keys) {
			if (key === "tokenCreator" || key === "burn") {
				expect(details[key].tokenBalance).to.equal(halfOfSupply);
			} else {
				expect(details[key].tokenBalance).to.equal(BigNumber.from(0));
			}
		}
	})

	it ("check the default allowance of everyone is 0", async function() {
		const details = await getDetailsOfSigners.bind(this)();
		const keys = Object.keys(details);
		for (const key1 of keys) {
			for (const key2 of keys) {
				expect(details[key1].allowances[key2]).to.equal(0);
			}
		}
	})

	it ("check the right addresses are excluded", async function() {
		const charityExcluded = await isInExcludeList.bind(this)(this.signers.charity.address.toString());
		const marketingExcluded = await isInExcludeList.bind(this)(this.signers.charity.address.toString())
		const burnExcluded = await isInExcludeList.bind(this)(this.signers.charity.address.toString())
		const ownerExcluded = await isInExcludeList.bind(this)(this.signers.tokenCreator.address.toString())
		const regularUserExcluded = await isInExcludeList.bind(this)(this.signers.phil.address.toString())

		expect(charityExcluded).to.be.true;
		expect(marketingExcluded).to.be.true;
		expect(burnExcluded).to.be.true;
		expect(ownerExcluded).to.be.true;
		expect(regularUserExcluded).to.be.false;
	})

	it ("check that no one is included", async function() {
		const charityIncluded = await isInIncludeList.bind(this)(this.signers.charity.address.toString());
		const marketingIncluded = await isInIncludeList.bind(this)(this.signers.charity.address.toString())
		const burnIncluded = await isInIncludeList.bind(this)(this.signers.charity.address.toString())
		const ownerIncluded = await isInIncludeList.bind(this)(this.signers.tokenCreator.address.toString())
		const regularUserIncluded = await isInIncludeList.bind(this)(this.signers.phil.address.toString())

		expect(charityIncluded).to.be.false;
		expect(marketingIncluded).to.be.false;
		expect(burnIncluded).to.be.false;
		expect(ownerIncluded).to.be.false;
		expect(regularUserIncluded).to.be.false;
	})
}