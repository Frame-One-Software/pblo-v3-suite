import {parseEther} from "ethers/lib/utils";
import {easyTransfer} from "./utils/easyTransfers";
import chai from "chai";
import {
	addToExcludeList,
	addToIncludeList,
	isInExcludeList,
	isInIncludeList,
	removeFromExcludeList
} from "./utils/easyExcludeAndInclude";

const expect = chai.expect;

export default function RegularUseFunctionTests() {

	const transferAmount = parseEther("100");

	it("Check that by default people are excluded from all lists", async function () {
		const isExcluded = await isInExcludeList.bind(this)(this.signers.peter.address);
		const isIncluded = await isInIncludeList.bind(this)(this.signers.peter.address);
		expect(isExcluded).to.be.false;
		expect(isIncluded).to.be.false;
	})

	describe("Check transfers with includes and exclude variations", async function () {

		/**
		 * transfer tokens for some transactions
		 */
		beforeEach(async function () {
			// give signers some tokens
			await this.contracts.tokenContract.connect(this.signers.tokenCreator).transfer(this.signers.peter.address, parseEther("1000"));
			await this.contracts.tokenContract.connect(this.signers.tokenCreator).transfer(this.signers.khan.address, parseEther("1000"));
		})

		it("From: neither | To: neither", async function () {
			await easyTransfer.bind(this)("peter", "khan", transferAmount);
		})

		it("From: neither | To: included", async function () {
			await addToIncludeList.bind(this)(this.signers.khan.address);
			await easyTransfer.bind(this)("peter", "khan", transferAmount);
		})

		it("From: neither | To: excluded", async function () {
			await addToExcludeList.bind(this)(this.signers.khan.address);
			await easyTransfer.bind(this)("peter", "khan", transferAmount);
		})

		it("From: included | To: neither", async function () {
			await addToIncludeList.bind(this)(this.signers.peter.address);
			await easyTransfer.bind(this)("peter", "khan", transferAmount);
		})

		it("From: included | To: included", async function () {
			await addToIncludeList.bind(this)(this.signers.peter.address);
			await addToIncludeList.bind(this)(this.signers.khan.address);
			await easyTransfer.bind(this)("peter", "khan", transferAmount);
		})

		it("From: included | To: excluded", async function () {
			await addToIncludeList.bind(this)(this.signers.peter.address);
			await addToExcludeList.bind(this)(this.signers.khan.address);
			await easyTransfer.bind(this)("peter", "khan", transferAmount);
		})

		it("From: excluded | To: neither", async function () {
			await addToExcludeList.bind(this)(this.signers.peter.address);
			await easyTransfer.bind(this)("peter", "khan", transferAmount);
		})

		it("From: excluded | To: included", async function () {
			await addToExcludeList.bind(this)(this.signers.peter.address);
			await addToIncludeList.bind(this)(this.signers.khan.address);
			await easyTransfer.bind(this)("peter", "khan", transferAmount);
		})

		it("From: excluded | To: excluded", async function () {
			await addToExcludeList.bind(this)(this.signers.peter.address);
			await addToExcludeList.bind(this)(this.signers.khan.address);
			await easyTransfer.bind(this)("peter", "khan", transferAmount);
		})

	})

	describe("Check statuses of adding and removing directly and the require statements", async function () {
		// TODO
	})

	describe("Check transfers with includes and exclude variations", async function () {
		// TODO
	})

}