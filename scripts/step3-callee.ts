import step3 from "./step3-createContract";

/**
 * STEP 3 - Callee
 *
 * For testing purposes I need the function abstracted out, so we use this to call it in the package.json
 *
 */
async function main(): Promise<void> {
	await step3()
}

main()
	.then(() => process.exit(0))
	.catch((error: Error) => {
		console.error(error);
		process.exit(1);
	});