import {ethers} from "hardhat";
import {BigNumber, Contract} from "ethers";
import oldPabloTokenABI from "../abis/oldPabloTokenABI";
import neatCSV from "neat-csv";
import fs from "fs"
import ProgressBar from "progress";
import {ObjectStringifierHeader} from "csv-writer/src/lib/record";
import {promisify} from "util";
import {CSVRow} from "./step1-getRealBalances";

// create a version of fsRead that can be used as a promise
const readFileAsync = promisify(fs.readFile);

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
	const completeAirdropPath = `${__dirname}/../data/airdropCSV-1625711349132.csv`; // TODO replace with newest one
	const completeAirdropWithAdjustmentsPath = `${__dirname}/../data/airdropWithAdjustmentsCSV-${now}.csv`;
	const addressHeader = "HolderAddress";
	const balanceHeader = "Balance";
	const bonusPercent = 20; // this will have a div 100 happen after applied
	const headerOptions: ObjectStringifierHeader = [
		{id: "holderAddress" as keyof CSVRow, title: addressHeader},
		{id: "balance" as keyof CSVRow, title: balanceHeader},
	]
	const liquidityHolder = "0x1527664b2054c8442811B34B4E34a578fc0d0cF9";
	const ignoredAddresses: string[] = [
		"0xfF076c793be75975eFa9083067d72a6cCE7a03DB", // pablo contract address
		"0x55a37dE8a2b19304591364c64C240A3485af587f", // lp pair
		liquidityHolder // want to avoid giving this address more than it should
	];

	// get creator address
	const signers = await ethers.getSigners();
	const creator = signers[0];

	// get the old token contract
	const tokenContract = new Contract(oldPabloTokenAddress, oldPabloTokenABI, creator);

	// get the address of the LPPair
	console.log("getting amount of tokens in liquidity...");
	const LPPairAddress = await tokenContract.connect(creator).uniswapV2Pair();

	// get the amount of tokens in liquidity right now
	const balanceOnTheLPPAir = await tokenContract.connect(creator).balanceOf(LPPairAddress);

	// convert the csv into a JSON with neat-csv https://github.com/sindresorhus/neat-csv
	console.log("reading csv...");
	const csvString = await readFileAsync(completeAirdropPath, "utf8");
	const parsedAirdropCSV = await neatCSV(csvString);

	// remove addresses that should not receive an airdrop
	console.log("adjusting values...");
	const cleanedAirdrop = parsedAirdropCSV.filter((v) => !ignoredAddresses.includes(v[addressHeader]))

	// add bonuses to the users
	const cleanedAirdropWithBonuses = cleanedAirdrop.map((v): CSVRow => ({
		holderAddress: v[addressHeader],
		balance: BigNumber.from(v[balanceHeader]).mul(bonusPercent).div(BigNumber.from(100)).toString(),
	}))

	// add the liquidity holder in
	cleanedAirdropWithBonuses.push({holderAddress: liquidityHolder, balance: balanceOnTheLPPAir.toString()});

	// write the new CSV

}

main()
	.then(() => process.exit(0))
	.catch((error: Error) => {
		console.error("error", error);
		process.exit(1);
	});
