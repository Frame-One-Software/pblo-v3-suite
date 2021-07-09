import {ethers} from "hardhat";
import {BigNumber, Contract} from "ethers";
import oldPabloTokenABI from "../abis/oldPabloTokenABI";
import neatCSV from "neat-csv";
import fs from "fs"
import ProgressBar from "progress";
import {ObjectStringifierHeader} from "csv-writer/src/lib/record";
import {promisify} from "util";
import {CSVRow} from "./step1-getRealBalances";
import {formatEther} from "ethers/lib/utils";

// create a version of fsRead that can be used as a promise
const readFileAsync = promisify(fs.readFile);

// create a csv write class constructor
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

export interface CSVRowWithAdjustments extends CSVRow {
	oldBalance?: string,
	percentageChange?: string,
	note?: string,
}

/**
 * STEP 2
 *
 * We are performing a handful of operations on the CSV. The changes we need to make are applying a bonus to each user
 * to make up for their losses, and then removing any contracts from the list that don't make sense to airdrop new tokens
 * to. This also includes summing up a new total supply and performing a sanity check on balances.
 *
 * The second part of this is to give tokens to the liquidity holder, since they will not be able to get their tokens
 * from the locked LP. This should be equal to the amount already in the liquidity
 */
async function main(): Promise<void> {

	// set the variables
	const now = Date.now();
	const oldPabloTokenAddress = "0xfF076c793be75975eFa9083067d72a6cCE7a03DB"; // mainnet
	const completeAirdropPath = `${__dirname}/../data/airdropCSV-1625780109933.csv`; // TODO replace with newest one
	const completeAirdropWithAdjustmentsPath = `${__dirname}/../data/airdropWithAdjustmentsCSV-${now}.csv`;
	const addressHeader = "HolderAddress";
	const balanceHeader = "Balance";
	const bonusPercent = 20; // this will have a div 100 happen after applied
	const headerOptions: ObjectStringifierHeader = [
		{id: "holderAddress" as keyof CSVRowWithAdjustments, title: addressHeader},
		{id: "balance" as keyof CSVRowWithAdjustments, title: balanceHeader},
		{id: "oldBalance" as keyof CSVRowWithAdjustments, title: "OldBalance"},
		{id: "percentageChange" as keyof CSVRowWithAdjustments, title: "PercentageChange"},
		{id: "note" as keyof CSVRowWithAdjustments, title: "Note"},
	]
	const liquidityHolder = "0x1527664b2054c8442811B34B4E34a578fc0d0cF9";
	const dxLockerAddress = "0x2d045410f002a95efcee67759a92518fa3fce677";
	const marketingAddress = "0x9656b113b4f54102d232fa5d87d1f13f5c522dac";
	const ignoredAddresses: string[] = [
		liquidityHolder, // want to avoid giving this address more than it should
		dxLockerAddress, // dxlocker
		"0xfF076c793be75975eFa9083067d72a6cCE7a03DB", // pablo contract address
		"0x55a37dE8a2b19304591364c64C240A3485af587f", // lp pair
		"0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F", // pancake router v1
		"0x10ED43C718714eb63d5aA57B78B54704E256024E", // pancake router v2
		"0x0f226b153EBa8c13aa8361Eba8F88a334BAB92A0", // old pbt LP Pair
		"0x7cA89B3A7159D3fD20812A8b45b9Aff6d9aDC9a4", // old pbt contract
		ethers.constants.AddressZero // address 0
	].map(v => v.toLowerCase());

	// get creator address
	const signers = await ethers.getSigners();
	const creator = signers[0];

	// get the old token contract
	const tokenContract = new Contract(oldPabloTokenAddress, oldPabloTokenABI, creator);

	// get the address of the LPPair
	console.log("getting amount of tokens in liquidity...");
	const LPPairAddress = await tokenContract.connect(creator).uniswapV2Pair();

	// sanity add the LPPair to the ignore list (i know its already in there, just in case)
	ignoredAddresses.push(LPPairAddress.toLowerCase());

	// get the amount of tokens in liquidity right now
	const balanceOnTheLPPAir = await tokenContract.connect(creator).balanceOf(LPPairAddress);

	// get the amount of tokens in dxlocker
	const balanceInLocker = await tokenContract.connect(creator).balanceOf(dxLockerAddress);

	// convert the csv into a JSON with neat-csv https://github.com/sindresorhus/neat-csv
	console.log("reading csv...");
	const csvString = await readFileAsync(completeAirdropPath, "utf8");
	const parsedAirdropCSV = await neatCSV(csvString);

	// remove addresses that should not receive an airdrop because of no balance
	console.log("adjusting values...");
	const listOfNoBalanceAddresses: string[] = []
	const holdBalanceAirdrop  = parsedAirdropCSV.filter(v => {
		const hasBalance = BigNumber.from(v[balanceHeader]).gt(0);
		if (!hasBalance) {
			listOfNoBalanceAddresses.push(v[addressHeader]);
		}
		return hasBalance;
	});

	// remove addresses in the ignore list
	const listOfIgnoredAddresses: string[] = [];
	const cleanedAirdrop = holdBalanceAirdrop.filter((v) => {
		const inIgnoreList = ignoredAddresses.includes(v[addressHeader].toLowerCase())
		if (inIgnoreList && v[addressHeader] !== liquidityHolder && v[addressHeader] !== marketingAddress) {
			listOfIgnoredAddresses.push(v[addressHeader]);
		}
		return !inIgnoreList;
	});

	// add the liquidity holder in
	cleanedAirdrop.push({
		[addressHeader]: liquidityHolder,
		[balanceHeader]: balanceOnTheLPPAir.toString(),
		note: "This is the amount that was on the LP Token, it will be transferred to the liquidity holder.",
	});

	// add the dxlocker tokens back to the marketing
	cleanedAirdrop.push({
		[addressHeader]: marketingAddress,
		[balanceHeader]: balanceInLocker.toString(),
		note: "This is the amount that was in dxlock, it will be transferred to the marketing wallet.",
	})

	// add bonuses to the users
	const percentForEquation = BigNumber.from(100).add(bonusPercent) // basically we want to multiply by 1 + bonus, so 20% bonus  === 120%
	const cleanedAirdropWithBonuses = cleanedAirdrop.map((v): CSVRowWithAdjustments => {
		const oldBalance = v[balanceHeader];
		const newBalance = BigNumber.from(oldBalance).mul(percentForEquation).div(BigNumber.from(100));
		const changedAmount = newBalance.sub(BigNumber.from(oldBalance));
		const percentageChange = BigNumber.from(changedAmount).mul(10000).div(oldBalance);
		return {
			holderAddress: v[addressHeader],
			balance: newBalance.toString(),
			oldBalance: oldBalance,
			percentageChange: (Number(percentageChange)/100).toString() + "%",
			note: v.note ? v.note : "",
		}
	})

	// sort by new order of largest holders to smallest

	// write the new CSV
	console.log("writing new csv...\n")
	const csvWriter = createCsvWriter({
		path: completeAirdropWithAdjustmentsPath,
		header: headerOptions
	})

	await csvWriter.writeRecords(cleanedAirdropWithBonuses);

	// print out a list of addresses that will be removed from airdrop with no balance
	console.log("The following addresses have a balance of 0 and will be removed from the airdrop...")
	console.table(listOfNoBalanceAddresses);

	console.log("The following addresses are in the ignore list and will be removed from the airdrop...")
	console.table(listOfIgnoredAddresses);


	// calculate new totalSupply
	const newTotalSupply = cleanedAirdropWithBonuses.reduce((acc: BigNumber, currentValue) => acc.add(BigNumber.from(currentValue.balance)), BigNumber.from(0));
	const oldTotalSupplyCalculated = parsedAirdropCSV.reduce((acc: BigNumber, currentValue) => acc.add(BigNumber.from(currentValue[balanceHeader])), BigNumber.from(0))

	// find changes
	const differenceInWei = newTotalSupply.sub(oldTotalSupplyCalculated)
	const differenceInTokens = formatEther(differenceInWei).split(".")[0];
	const percentageChange = differenceInWei.mul(BigNumber.from(10000)).div(oldTotalSupplyCalculated).toNumber() / 100

	// for easy visibility, create a table
	console.log("The changes in tokens summary are...")
	console.table({
		"New Total Supply (tokens)": formatEther(newTotalSupply).split(".")[0],
		"Old Total Supply (tokens)": formatEther(oldTotalSupplyCalculated).split(".")[0],
		"New Total Supply (wei)": newTotalSupply.toString(),
		"Old Total Supply (wei)": oldTotalSupplyCalculated.toString(),
		"Total Supply Increased By (tokens)": differenceInTokens.toString(),
		"Total Supply Increased By (wei)": differenceInWei.toString(),
		"Change in Total Supply (percentage)": percentageChange + "%",
		"Number of Addresses removed from Airdrop": listOfIgnoredAddresses.length + listOfNoBalanceAddresses.length
	})
}

main()
	.then(() => process.exit(0))
	.catch((error: Error) => {
		console.error("error", error);
		process.exit(1);
	});
