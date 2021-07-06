import {BigNumber} from "ethers";
import getDetailsOfSigners from "./getDetailsOfSigners";
import {checkBeforeAndAfter} from "./checkBeforeAndAfter";
import {Contracts, Signers} from "../../types";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

/**
 * a util for doing transfers with check and asserts afterwards
 */
async function easyTransfer(this: { signers: Signers, contracts: Contracts }, fromKey: keyof Signers, toKey: keyof Signers, amount: BigNumber) {

	// get details before
	const detailsBefore = await getDetailsOfSigners.bind(this)();

	// get total supply before
	const totalSupplyBefore = await this.contracts.tokenContract.totalSupply();

	// perform transfer
	await this.contracts.tokenContract.connect(this.signers[fromKey] as SignerWithAddress).transfer(this.signers[toKey].address, amount);

	// get details after
	const detailsAfter = await getDetailsOfSigners.bind(this)();

	// get total supply after
	const totalSupplyAfter = await this.contracts.tokenContract.totalSupply();

	// run checks
	await checkBeforeAndAfter.bind(this)({
		fromKey,
		toKey,
		amount,
		detailsBefore,
		detailsAfter,
		totalSupplyBefore,
		totalSupplyAfter
	});
}

export {
	easyTransfer
};