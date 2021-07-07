import {parseEther} from "ethers/lib/utils";
import {easyTransfer} from "./utils/easyTransfers";
import chai from "chai";
import {
	addToExcludeList,
	addToIncludeList,
	isInExcludeList,
	isInIncludeList,
} from "./utils/easyExcludeAndInclude";
import {BigNumber} from "ethers";
import {Contracts, Signers} from "../types";

const expect = chai.expect;

export default function RegularUseFunctionTests() {

	const transferAmount100Eth = parseEther("100");
	const transferAmount0 = BigNumber.from(0);
	const transferAmountAwkwardAmount1 = BigNumber.from(333);
	const transferAmountAwkwardAmount2 = BigNumber.from(1);
	const transferAmountAwkwardAmount3 = BigNumber.from(3);
	const transferAmountAwkwardAmount4 = BigNumber.from(99);
	const transferAmountAwkwardAmount5 = parseEther("3.33333333");
	const transferAmountAwkwardAmount6 = parseEther("6.99999999999999");

	it("Check that by default people are excluded from all lists", async function () {
		const isExcluded = await isInExcludeList.bind(this)(this.signers.peter.address);
		const isIncluded = await isInIncludeList.bind(this)(this.signers.peter.address);
		expect(isExcluded).to.be.false;
		expect(isIncluded).to.be.false;
	})

	describe("Check transfers with includes and exclude variations", async function () {

		async function doTransferTests(this: { signers: Signers, contracts: Contracts }) {
			await easyTransfer.bind(this)("peter", "khan", transferAmount100Eth);
			await easyTransfer.bind(this)("peter", "khan", transferAmountAwkwardAmount1);
			await easyTransfer.bind(this)("peter", "khan", transferAmountAwkwardAmount2);
			await easyTransfer.bind(this)("peter", "khan", transferAmountAwkwardAmount3);
			await easyTransfer.bind(this)("peter", "khan", transferAmountAwkwardAmount4);
			await easyTransfer.bind(this)("peter", "khan", transferAmountAwkwardAmount5);
			await easyTransfer.bind(this)("peter", "khan", transferAmountAwkwardAmount6);

			// check that 0 doesn't work
			let failed = false;
			try {
				await easyTransfer.bind(this)("peter", "khan", transferAmount0);
			} catch {
				failed = true
			}
			expect(failed).to.be.true
		}

		/**
		 * transfer tokens for some transactions
		 */
		beforeEach(async function () {
			// give signers some tokens
			await this.contracts.tokenContract.connect(this.signers.tokenCreator).transfer(this.signers.peter.address, parseEther("100000"));
			await this.contracts.tokenContract.connect(this.signers.tokenCreator).transfer(this.signers.khan.address, parseEther("100000"));
		})

		it("From: neither | To: neither", async function () {
			await doTransferTests.bind(this)();
		})

		it("From: neither | To: included", async function () {
			await addToIncludeList.bind(this)(this.signers.khan.address);
			await doTransferTests.bind(this)();
		})

		it("From: neither | To: excluded", async function () {
			await addToExcludeList.bind(this)(this.signers.khan.address);
			await doTransferTests.bind(this)();
		})

		it("From: included | To: neither", async function () {
			await addToIncludeList.bind(this)(this.signers.peter.address);
			await doTransferTests.bind(this)();
		})

		it("From: included | To: included", async function () {
			await addToIncludeList.bind(this)(this.signers.peter.address);
			await addToIncludeList.bind(this)(this.signers.khan.address);
			await doTransferTests.bind(this)();
		})

		it("From: included | To: excluded", async function () {
			await addToIncludeList.bind(this)(this.signers.peter.address);
			await addToExcludeList.bind(this)(this.signers.khan.address);
			await doTransferTests.bind(this)();
		})

		it("From: excluded | To: neither", async function () {
			await addToExcludeList.bind(this)(this.signers.peter.address);
			await doTransferTests.bind(this)();
		})

		it("From: excluded | To: included", async function () {
			await addToExcludeList.bind(this)(this.signers.peter.address);
			await addToIncludeList.bind(this)(this.signers.khan.address);
			await doTransferTests.bind(this)();
		})

		it("From: excluded | To: excluded", async function () {
			await addToExcludeList.bind(this)(this.signers.peter.address);
			await addToExcludeList.bind(this)(this.signers.khan.address);
			await doTransferTests.bind(this)();
		})

	})

	it("Check statuses of adding and removing directly and the require statements", async function () {
		// TODO
	})

	it("Check transfers with includes and exclude variations", async function () {
		// TODO
	})

	it("Check manual burns work", async function () {
		// TODO
	})

	it("Check burns on transactions stop at 100 trillion", async function() {
		// TODO
	})

}