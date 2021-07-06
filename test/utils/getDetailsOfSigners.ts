import {Contracts, SignerDetailAllowances, SignerDetails, Signers} from "../../types";

async function getDetailsOfSigners(this: { signers: Signers, contracts: Contracts }) {

	// set up empty map
	const details: SignerDetails = {} as SignerDetails;

	// get all the signers
	const keys = Object.keys(this.signers);

	// get the details for each signer
	const detailPromises = keys.map(async (key) => {

		// get the signer
		const signer = this.signers[key];

		// get the balance
		const tokenBalance = await this.contracts.tokenContract.balanceOf(signer.address);

		// create map to hold all allowances
		const allowances: SignerDetailAllowances = {} as SignerDetailAllowances;

		// iterate over all signers and get the allowances
		const allowancePromises = keys.map(async (key2) => {
			const signer2 = this.signers[key2];
			allowances[key2 as keyof Signers] = await this.contracts.tokenContract.allowance(signer2.address, signer.address);
		})
		await Promise.all(allowancePromises);

		// add to the map
		details[key as keyof Signers] = {
			tokenBalance,
			allowances,
		};
	});

	// wait and return
	await Promise.all(detailPromises);
	return details
}

export default getDetailsOfSigners;