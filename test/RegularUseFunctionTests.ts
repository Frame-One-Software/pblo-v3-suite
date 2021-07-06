import {parseEther} from "ethers/lib/utils";
import {easyTransfer} from "./utils/easyTransfers";
import {excludeFromFee, includeInFee, isExcludedFromFee} from "./utils/easyExcludeAndInclude";
import chai from "chai";

const expect = chai.expect;

export default function RegularUseFunctionTests() {

	const transferAmount = parseEther("100");

	describe("check the fees being used with their accordance with super includes and excludes", async function () {
		it("Check that by default people are excluded from fees", async function () {
			const res = await isExcludedFromFee.bind(this)(this.signers.peter.address);
			expect(res).to.be.true;
		})

		describe("Check transfers with super excludes", async function () {

			/**
			 * transfer tokens for some transactions
			 */
			beforeEach(async function () {
				// give signers some tokens
				await this.contracts.tokenContract.connect(this.signers.tokenCreator).transfer(this.signers.peter.address, parseEther("1000"));
				await this.contracts.tokenContract.connect(this.signers.tokenCreator).transfer(this.signers.khan.address, parseEther("1000"));
			})

			/**
			 * Do the transfer afterward, saves writing this every time
			 */
			afterEach(async function () {
				await easyTransfer.bind(this)("peter", "khan", transferAmount);
			})

			it("From (fee): included | To (fee): included", async function () {
				await includeInFee.bind(this)(this.signers.peter.address);
				await includeInFee.bind(this)(this.signers.khan.address);
			})

			it("From (fee): included | To (fee): excluded", async function () {
				await includeInFee.bind(this)(this.signers.peter.address);
				await excludeFromFee.bind(this)(this.signers.khan.address);
			})

			it("From (fee): excluded | To (fee): included", async function () {
				await excludeFromFee.bind(this)(this.signers.peter.address);
				await includeInFee.bind(this)(this.signers.khan.address);
			})

			it("From (fee): excluded | To (fee): excluded", async function () {
				await excludeFromFee.bind(this)(this.signers.peter.address);
				await excludeFromFee.bind(this)(this.signers.khan.address);
			})

		})

		describe("Check transfers with exclusions from fees", async function () {

			/**
			 * transfer tokens for some transactions
			 */
			beforeEach(async function () {
				// give signers some tokens
				await this.contracts.tokenContract.connect(this.signers.tokenCreator).transfer(this.signers.peter.address, parseEther("1000"));
				await this.contracts.tokenContract.connect(this.signers.tokenCreator).transfer(this.signers.khan.address, parseEther("1000"));
			})

			/**
			 * Do the transfer afterward, saves writing this every time
			 */
			afterEach(async function () {
				await easyTransfer.bind(this)("peter", "khan", transferAmount);
			})

			it("From (fee): included | To (fee): included", async function () {
				await includeInFee.bind(this)(this.signers.peter.address);
				await includeInFee.bind(this)(this.signers.khan.address);
			})

			it("From (fee): included | To (fee): excluded", async function () {
				await includeInFee.bind(this)(this.signers.peter.address);
				await excludeFromFee.bind(this)(this.signers.khan.address);
			})

			it("From (fee): excluded | To (fee): included", async function () {
				await excludeFromFee.bind(this)(this.signers.peter.address);
				await includeInFee.bind(this)(this.signers.khan.address);
			})

			it("From (fee): excluded | To (fee): excluded", async function () {
				await excludeFromFee.bind(this)(this.signers.peter.address);
				await excludeFromFee.bind(this)(this.signers.khan.address);
			})

			it("Check that by default people are excluded from fees", async function () {
				const res = await isExcludedFromFee.bind(this)(this.signers.peter.address);
				expect(res).to.be.true;
			})

		})
	})




	describe("Check allowances", async function () {
		// TODO
	})

}