import chai from "chai";
import {Contracts, Signers} from "../../types";

const expect = chai.expect;

async function isInSuperExcludeList(this: { signers: Signers, contracts: Contracts }, address: string) {
	return this.contracts.tokenContract.isExcludedFromFee(address);
}

async function isInSuperIncludeList(this: { signers: Signers, contracts: Contracts }, address: string) {
	return this.contracts.tokenContract.isExcludedFromFee(address);
}

async function addToSuperExcludeList(this: { signers: Signers, contracts: Contracts }, address: string) {
	await this.contracts.tokenContract.connect(this.signers.tokenCreator).includeInSuperExclude(address);
	const excluded = await isExcludedFromFee.bind(this)(address);
	expect(excluded).to.be.false;
}

async function removeFromSuperExcludeList(this: { signers: Signers, contracts: Contracts }, address: string) {
	await this.contracts.tokenContract.connect(this.signers.tokenCreator).removeSuperExclude(address);
	const excluded = await isExcludedFromFee.bind(this)(address);
	expect(excluded).to.be.false;
}


async function addToSuperIncludeList(this: { signers: Signers, contracts: Contracts }, address: string) {
	await this.contracts.tokenContract.connect(this.signers.tokenCreator).includeInFee(address);
	const excluded = await isExcludedFromFee.bind(this)(address);
	expect(excluded).to.be.true;
}

async function removeFromSuperIncludeList(this: { signers: Signers, contracts: Contracts }, address: string) {
	await this.contracts.tokenContract.connect(this.signers.tokenCreator).includeInFee(address);
	const excluded = await isExcludedFromFee.bind(this)(address);
	expect(excluded).to.be.true;
}

export {
	isInSuperExcludeList,
	isInSuperIncludeList,
	addToSuperExcludeList,
	removeFromSuperExcludeList,
	addToSuperIncludeList,
	removeFromSuperIncludeList
}