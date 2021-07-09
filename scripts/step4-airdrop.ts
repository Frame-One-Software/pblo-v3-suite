import hre, {ethers, run} from "hardhat";
import {Artifact} from "hardhat/types";
import {deployContract} from "ethereum-waffle";
import neatCSV from "neat-csv";
import {promisify} from "util";
import fs from "fs";
import { CSVRowWithAdjustments } from "./step2-adjustCSV";
import {chunk} from "lodash";
import {BigNumber, Contract} from "ethers";
import ProgressBar from "progress";
import config from "../hardhat.config";
import step3 from "./step3-createContract";
import {formatEther} from "ethers/lib/utils";

// create a version of fsRead that can be used as a promise
const readFileAsync = promisify(fs.readFile);

/**
 * STEP 4
 *
 * This will run the entire airdrop based on the contrat from step 3 and CSV export from step 2. First this will deploy
 * the PBLOAirdrop.sol file from contracts. Then it will use this to batch send requests to everyone.
 *
 * NOTE 1: I do not want to run the airdrops in a Promise.all, in case there is an error it makes it easier to identify
 * where the airdrop stopped and we can adjust the CSV to continue.
 */
async function main(): Promise<void> {

	// set the variables
	let tokenContractAddress = "0x7156890B5331F56DfE7a0f1c95a7d9981A9E2f51"; //TODO replace with deployment from step 3
	const pbloAirdropArtifactName = "PBLOAirdrop";
	const completeAirdropWithAdjustmentsPath = `${__dirname}/../data/airdropWithAdjustmentsCSV-1625867789081.csv`;
	const chunkSize = 140
	const addressHeader = "HolderAddress";
	const balanceHeader = "Balance";

	// if on hardhat network run step 3
	if (config.defaultNetwork === "hardhat") {
		tokenContractAddress = await step3();
	}

	// get creator address
	const signers = await ethers.getSigners();
	const creator = signers[0];

	// get the token contract
	const tokenABI = (await import(`../artifacts/contracts/Pablo.sol/PABLO.json`)).abi;
	const tokenContract = new Contract(tokenContractAddress, tokenABI, creator);

	// read the CSV
	console.log("reading csv...")
	const csvString = await readFileAsync(completeAirdropWithAdjustmentsPath, "utf8");
	const parsedAirdropCSV: CSVRowWithAdjustments[] = await neatCSV(csvString);

	// create 2 arrays of each for readability
	console.log("formatting data...");
	const allAddresses = parsedAirdropCSV.map(row => row[addressHeader]);
	const allAmounts = parsedAirdropCSV.map(row => BigNumber.from(row[balanceHeader]));

	// chunk the results
	const addressChunks = chunk(allAddresses, chunkSize);
	const amountChunks = chunk(allAmounts, chunkSize);
	const length = addressChunks.length;

	// create the airdrop deployment contract
	console.log("deploying airdrop contract...");
	const pbloAirdropArtifact: Artifact = await hre.artifacts.readArtifact(pbloAirdropArtifactName);
	const pbloAirdropArguments = [tokenContractAddress];
	const pbloAirdrop = await deployContract(creator, pbloAirdropArtifact, pbloAirdropArguments);
	await pbloAirdrop.deployed();

	console.log(`airdrop contract deployed at ${pbloAirdrop.address}`);

	// verify the contract, because it looks nice
	if (config.defaultNetwork !== "hardhat") {
		// await run("verify:verify", {
		// 	address: pbloAirdrop.address,
		// 	constructorArguments: pbloAirdropArguments,
		// })
	}

	console.log("setting allowance to the total supply...")
	const totalSupply = await tokenContract.connect(creator).totalSupply();
	const allowanceTransaction = await tokenContract.connect(creator).approve(pbloAirdrop.address.toString(), totalSupply);
	await allowanceTransaction.wait();

	// create a loading bar to monitor progress
	const progressBar = new ProgressBar(`[:bar] | :current/:total chunks (:percent) | Chunk Size: ${chunkSize} | Elapsed::elapseds ETA::etas`, {
		complete: '=',
		incomplete: ' ',
		width: 20,
		total: length,
	});
	progressBar.render();
	progressBar.interrupt("starting airdrop...");

	// Do the airdrop
	for (let i = 0; i < length; i++) {

		// grab the chunks
		const addresses = addressChunks[i];
		const amounts = amountChunks[i];

		// call the send command
		const transaction = await pbloAirdrop.connect(creator).multiERC20Transfer(addresses, amounts)

		// wait for the confirmation
		const receipt = await transaction.wait();

		// progress the progress bar
		progressBar.interrupt(`Addresses from '${addresses[0]}' to '${addresses[addresses.length - 1]}' have been sent.`)

		// verify the transactions
		const promises = addresses.map((address, i) => {
			const amount = amounts[i];

			// nest for easy retries
			async function verifyBalance(): Promise<string | void> {

				// check to see if it is the creator
				if (address.toLowerCase() === creator.address.toString().toLowerCase()) {
					progressBar.interrupt(`'${address}' could not be verified because it is the creator. Please check manually afterward.`);
					return;
				}

				let balance: BigNumber;
				try {
					balance = await tokenContract.connect(creator).balanceOf(address);
				} catch (err) {
					return verifyBalance();
				}

				if (!amount.eq(balance)) {

					// check and see if it is one of the addresses that are multiple in the list
					const timesInList = addresses.reduce((acc, v) => v.toLowerCase() === address.toLowerCase() ? acc + 1 : acc, 0)
					if (timesInList > 1) {
						progressBar.interrupt(`'${address}' could not be verified because it is in the list ${timesInList} times. Please check manually afterward.`);
						return;
					}

					const errorMessage = `INVALID AIRDROP!!! '${address}' received ${formatEther(balance)} tokens, but should have received ${formatEther(amount)}. Error occurred between '${addresses[0]}' to '${addresses[addresses.length - 1]}'`;
					progressBar.interrupt(errorMessage);
					throw new Error(errorMessage);
				}

			}

			return verifyBalance();
		})

		await Promise.all(promises);

		// progress the progress bar
		progressBar.interrupt(`Addresses from '${addresses[0]}' to '${addresses[addresses.length - 1]}' have been verified.`)
		progressBar.tick();
	}

	await progressBar.terminate();

	console.log("Airdrop Complete! 🚀🌕");
}

main()
	.then(() => process.exit(0))
	.catch((error: Error) => {
		console.error(error);
		process.exit(1);
	});
