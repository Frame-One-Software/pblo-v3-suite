import {ethers} from "hardhat";
import {BigNumber, BigNumberish, Contract} from "ethers";
import oldPabloTokenABI from "../abis/oldPabloTokenABI";
import neatCSV from "neat-csv";
import fs from "fs"
import ProgressBar from "progress";
import {ObjectStringifierHeader} from "csv-writer/src/lib/record";
import {promisify} from "util";
import {formatEther} from "ethers/lib/utils";

// create a version of fsRead that can be used as a promise
const readFileAsync = promisify(fs.readFile);

// create a csv write class constructor
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// create an interface for the rows
export interface CSVRow {
	holderAddress: string,
	balance: string,
}

/**
 * STEP 1
 *
 * This function will take in a BSCSCan holders CSV, and generate the output with a list of balances. Add the bonus
 * is not done at this step to allow flexibility.
 *
 * NOTE 1: last time we did an airdrop, the CSV was extremely hard to work with. This is due to opening a CSV in any modern
 * software like excel or google drive, will not reflect the true decimal places of WEI. This is most likely due to wei
 * being a uint256 and softwares most likely only capable of holding a 32 bit number. Please be cautious if saving using
 * a software, as you can lost the data in the CSV.
 *
 * NOTE 2: As with any reflection token, the BSCScan result will be incorrect for the exact balance, as it only updates
 * in select cases. Becuase of this calling a balanceOf beforehand is necessary
 *
 * NOTE 3: This function will take a while, there is a chance that some transfers will happen during the running and
 * deployment of the airdrop, and these new tokens will not be accounted for. Best to run this and do the airdrop as
 * fast as possible if this is the case.
 *
 * NOTE 4: The CSV generated will be in Wei, the BSCscan one is in ether units.
 *
 * NOTE 5: There should be a difference of about 820658194293.908232317839740196 Tokens from the total supply and summation
 * of everyone's balances this is due to the bug of the automatic burns not working.
 */
async function main(): Promise<void> {

	// set the variables
	const now = Date.now();
	const oldPabloTokenAddress = "0xfF076c793be75975eFa9083067d72a6cCE7a03DB"; // mainnet
	const BSCScanExportPath = `${__dirname}/../data/bscScan-july7.csv`;
	const progressCachePath = `${__dirname}/../data/airdropCSV-cache-${now}.csv`;
	const completeAirdropPath = `${__dirname}/../data/airdropCSV-${now}.csv`;
	const addressHeader = "HolderAddress";
	const balanceHeader = "Balance";
	const batchSize = 10;
	const batchTime = 500;
	const headerOptions: ObjectStringifierHeader = [
		{id: "holderAddress" as keyof CSVRow, title: addressHeader},
		{id: "balance" as keyof CSVRow, title: balanceHeader},
	];

	// get creator address
	const signers = await ethers.getSigners();
	const creator = signers[0];

	// get the old token contract
	const tokenContract = new Contract(oldPabloTokenAddress, oldPabloTokenABI, creator);

	// convert the csv into a JSON with neat-csv https://github.com/sindresorhus/neat-csv
	console.log("reading csv...");
	const csvString = await readFileAsync(BSCScanExportPath, "utf8");
	const parsedBSCScanCSV = await neatCSV(csvString);
	const numberOfAddresses = parsedBSCScanCSV.length;

	// create a CSV writer for the cache
	const cacheCSVWriter = createCsvWriter({
		path: progressCachePath,
		header: headerOptions
	})

	// create a loading bar to monitor progress
	const progressBar = new ProgressBar("[:bar] | :current/:total (:percent) | Elapsed::elapseds ETA::etas", {
		complete: '=',
		incomplete: ' ',
		width: 20,
		total: numberOfAddresses,
	})

	// iterate over each one and create a promise to grab the balance
	console.log(`requesting balances...`);
	const promises = parsedBSCScanCSV.map(async (row, index) => {

		// create a delay equal to the index before starting to allow time to enter ethers queue
		const batchIndex = index / batchSize;
		const waitTime = Math.floor(batchIndex) * batchTime;
		await new Promise(r => setTimeout(r, waitTime));

		// pull out the address from the csv
		const address = row[addressHeader];

		// nested function for easy recursive retries
		async function getBalance(attemptNumber): Promise<CSVRow> {
			try {
				// make request to get balance
				const balance = await tokenContract.connect(creator).balanceOf(address);
				const finalizedRow: CSVRow = {
					holderAddress: address,
					balance: balance.toString(), // must be string in order not to crash
				}

				// write to the cache to view progress easier
				await cacheCSVWriter.writeRecords([finalizedRow]);

				// progress the loading bar
				progressBar.tick();

				// return address and balance
				return finalizedRow

			} catch (err) {
				// create an artificial delay to free up queue in ethers
				const randomTime = Math.random() * 10000 + 10000; // minimum 10 seconds, less than 20 seconds
				await new Promise(r => setTimeout(r, randomTime));

				// if there were 10 errors in a row, let the console know
				if (attemptNumber % 10 === 0 && attemptNumber !== 0) {
					progressBar.interrupt(`The address ${row[addressHeader]} has failed ${attemptNumber} times. (Batch: ${batchIndex})`);
				}

				return getBalance(attemptNumber + 1)
			}
		}

		// return the promise
		return getBalance(1);
	})

	// wait for promises to finish
	const updatedBalanceRows: CSVRow[] = await Promise.all(promises);

	// clear progress bar
	// clearInterval(interval);
	progressBar.terminate();
	console.log("Getting balances complete, saving results.");

	// create a new CSV
	const finalCSVWriter = createCsvWriter({
		path: completeAirdropPath,
		header: headerOptions
	})
	await finalCSVWriter.writeRecords(updatedBalanceRows);

	// do a sanity check on the totalBalance now that everything is complete to see if there are any issues
	const totalSupplyOnChain = await tokenContract.connect(creator).totalSupply();
	const totalSupplyCalculated = updatedBalanceRows.reduce((acc: BigNumber, currentValue) => acc.add(BigNumber.from(currentValue.balance)), BigNumber.from(0))

	console.log(`Total Supply from smart contract (${oldPabloTokenAddress}):`, totalSupplyOnChain.toString());
	console.log(`Total Supply from summation of CSV (${completeAirdropPath}):`, totalSupplyCalculated.toString());

	// calcuate a difference and show the user
	if (totalSupplyOnChain.toString() !== totalSupplyCalculated.toString()) {
		let difference: string;
		if (totalSupplyCalculated.gt(totalSupplyOnChain)) {
			difference = totalSupplyCalculated.sub(totalSupplyOnChain).toString();
		} else {
			difference = totalSupplyOnChain.sub(totalSupplyCalculated).toString();
		}
		console.error(`DANGER!!! TOTAL SUPPLIES DO NOT MATCH. THERE IS A DIFFERENCE OF ${formatEther(difference)} TOKENS (${difference} wei).`);
	} else {
		console.log("Total supplies match.")
	}
}

main()
	.then(() => process.exit(0))
	.catch((error: Error) => {
		console.error("error", error);
		process.exit(1);
	});
