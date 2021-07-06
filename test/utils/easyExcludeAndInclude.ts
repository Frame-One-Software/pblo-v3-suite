import chai from "chai";
import {Contracts, Signers} from "../../types";

const expect = chai.expect;

async function isExcludedFromFee(this: { signers: Signers, contracts: Contracts }, address: string) {
	return this.contracts.tokenContract.isExcludedFromFee(address);
}

async function excludeFromFee(this: { signers: Signers, contracts: Contracts }, address: string) {
	await this.contracts.tokenContract.connect(this.signers.tokenCreator).excludeFromFee(address);
	const excluded = await isExcludedFromFee.bind(this)(address);
	expect(excluded).to.be.false;
}

async function includeInFee(this: { signers: Signers, contracts: Contracts }, address: string) {
	await this.contracts.tokenContract.connect(this.signers.tokenCreator).includeInFee(address);
	const excluded = await isExcludedFromFee.bind(this)(address);
	expect(excluded).to.be.true;
}

export {
	isExcludedFromFee,
	excludeFromFee,
	includeInFee,
}