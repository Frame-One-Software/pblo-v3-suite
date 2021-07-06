import {Contracts, SignerDetails, Signers} from "../../types";
import chai from "chai";
import {BigNumber} from "ethers";
import {isInExcludeList, isInIncludeList} from "./easyExcludeAndInclude";

const expect = chai.expect;
const assert = chai.assert;

interface CheckRequirements {
	fromKey: keyof Signers;
	toKey: keyof Signers;
	amount: BigNumber;
	detailsBefore: SignerDetails;
	detailsAfter: SignerDetails;
	totalSupplyBefore: BigNumber;
	totalSupplyAfter: BigNumber;
}


/**
 * This is a  util to pass in the details before and after and it will check
 * the appropriate taxes and liquidity were taken account for.
 */
async function checkBeforeAndAfter(this: { signers: Signers, contracts: Contracts }, checkRequirements: CheckRequirements) {

	// extract input variables
	const {
		fromKey,
		toKey,
		amount,
		detailsBefore,
		detailsAfter,
		totalSupplyBefore,
		totalSupplyAfter,
	} = checkRequirements;

	// get necessary addresses
	const fromAddress = this.signers[fromKey].address;
	const toAddress = this.signers[toKey].address;

	// get necessary balances
	const fromBalanceBefore = detailsBefore[fromKey].tokenBalance;
	const toBalanceBefore = detailsBefore[toKey].tokenBalance;
	const marketingBalanceBefore = detailsBefore.marketing.tokenBalance;
	const charityBalanceBefore = detailsBefore.charity.tokenBalance;
	const fromBalanceAfter = detailsAfter[fromKey].tokenBalance;
	const toBalanceAfter = detailsAfter[toKey].tokenBalance;
	const marketingBalanceAfter = detailsAfter.marketing.tokenBalance;
	const charityBalanceAfter = detailsAfter.charity.tokenBalance;

	// get all appropriate rates, variables, and exclusions
	// NOTE: not sure why Promise.all(), does not work here, if you can fix, please do
	const [
		burnFeePercent,
		charityFeePercent,
		marketingFeePercent,
		fromAddressInExcludedList,
		fromAddressInIncludedList,
		toAddressInExcludedList,
		toAddressInIncludedList,
	] = [
		await this.contracts.tokenContract._burnFee(),
		await this.contracts.tokenContract._charityFee(),
		await this.contracts.tokenContract._marketingFee(),
		await isInExcludeList.bind(this)(fromAddress),
		await isInIncludeList.bind(this)(fromAddress),
		await isInExcludeList.bind(this)(toAddress),
		await isInIncludeList.bind(this)(toAddress),
	];

	// if either address is in the exclude list, then do a normal transfer with no fees
	// or if both addresses are not in the include list
	if (
		(fromAddressInExcludedList || toAddressInExcludedList) || // one address is in excluded
		(!fromAddressInIncludedList && !toAddressInIncludedList) // both addresses are not included
	) {
		// there should be no taxes on the transaction, thus like a regular transaction
		expect(toBalanceAfter).to.be.equal(toBalanceBefore.add(amount));
		expect(fromBalanceAfter).to.be.equal(fromBalanceBefore.sub(amount));
		return;
	}

	// calculate fees
	const charityFee = amount.mul(charityFeePercent as BigNumber).div(BigNumber.from(100));
	const marketingFee = amount.mul(marketingFeePercent as BigNumber).div(BigNumber.from(100));
	const burnFee = amount.mul(burnFeePercent as BigNumber).div(BigNumber.from(100));

	// calculate actual amount transferred
	const actualAmount = amount.sub(charityFee).sub(marketingFee).sub(burnFee);

	// check the from balance
	const expectedFromBalanceAfter = fromBalanceBefore.sub(amount)
	expect(fromBalanceAfter).to.be.equal(expectedFromBalanceAfter);

	// check the to balance
	const expectedToBalanceAfter = toBalanceBefore.add(actualAmount)
	expect(toBalanceAfter).to.be.equal(expectedToBalanceAfter);

	// check charity wallet
	const expectedCharityBalance = charityBalanceBefore.add(charityFee);
	expect(charityBalanceAfter).to.be.equal(expectedCharityBalance);

	// check the marketing wallet
	const expectedMarketingBalance = marketingBalanceBefore.add(marketingFee);
	expect(marketingBalanceAfter).to.be.equal(expectedMarketingBalance);

	// check the burn
	const expectedTotalSupplyAfter = totalSupplyBefore.sub(burnFee);
	expect(totalSupplyAfter).to.be.equal(expectedTotalSupplyAfter)
}

export {checkBeforeAndAfter};