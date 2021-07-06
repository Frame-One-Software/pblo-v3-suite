import chai from "chai";
import {Contracts, Signers} from "../../types";

const expect = chai.expect;

function isInExcludeList(this: { signers: Signers, contracts: Contracts }, address: string): Promise<boolean> {
	return this.contracts.tokenContract.isExcludedFromFees(address);
}

function isInIncludeList(this: { signers: Signers, contracts: Contracts }, address: string): Promise<boolean> {
	return this.contracts.tokenContract.isIncludedInFees(address);
}

async function addToExcludeList(this: { signers: Signers, contracts: Contracts }, address: string) {
	await this.contracts.tokenContract.connect(this.signers.tokenCreator).addToExcludeFromFeesList(address);
	const excluded = await isInExcludeList.bind(this)(address);
	expect(excluded).to.be.true;
}

async function removeFromExcludeList(this: { signers: Signers, contracts: Contracts }, address: string) {
	await this.contracts.tokenContract.connect(this.signers.tokenCreator).removeFromExcludeFromFeesList(address);
	const excluded = await isInExcludeList.bind(this)(address);
	expect(excluded).to.be.false;
}


async function addToIncludeList(this: { signers: Signers, contracts: Contracts }, address: string) {
	await this.contracts.tokenContract.connect(this.signers.tokenCreator).addToIncludeInFeesList(address);
	const included = await isInIncludeList.bind(this)(address);
	expect(included).to.be.true;
}

async function removeFromIncludeList(this: { signers: Signers, contracts: Contracts }, address: string) {
	await this.contracts.tokenContract.connect(this.signers.tokenCreator).removeFromIncludeInFeesList(address);
	const included = await isInIncludeList.bind(this)(address);
	expect(included).to.be.false;
}

export {
	isInExcludeList,
	isInIncludeList,
	addToExcludeList,
	removeFromExcludeList,
	addToIncludeList,
	removeFromIncludeList
}