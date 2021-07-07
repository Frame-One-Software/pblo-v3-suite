import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import {BigNumber, Contract} from "ethers";
import {WBNB, PancakeRouter, PancakeFactory, PBLO2Token} from "../typechain";

export interface Signers {
	tokenCreator: SignerWithAddress;
	pancakeSwapCreator: SignerWithAddress;
	peter: SignerWithAddress;
	christopher: SignerWithAddress;
	khan: SignerWithAddress;
	phil: SignerWithAddress;
	aman: SignerWithAddress;
	marketing: SignerWithAddress;
	charity: SignerWithAddress;
	burn: SignerWithAddress;
	tokenContract: PBLO2Token;
}

export interface Contracts {
	tokenContract: PBLO2Token;
	wbnb: WBNB;
	pancakeRouter: PancakeRouter;
	pancakeFactory: PancakeFactory;
	lpPair: Contract;
}

export interface SignerDetail {
	tokenBalance: BigNumber;
	allowances: SignerDetailAllowances;
}

export type SignerDetailAllowances = {
	[P in keyof Signers]: BigNumber;
}

export type SignerDetails = {
	[P in keyof Signers]: SignerDetail;
};
