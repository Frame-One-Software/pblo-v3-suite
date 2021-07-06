// eslint-disable @typescript-eslint/no-explicit-any
import { Fixture } from "ethereum-waffle";
import {Contracts, SignerDetails, Signers} from "./";
import {BigNumber} from "ethers";

declare module "mocha" {
  export interface Context {
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
    signers: Signers;
    contracts: Contracts;
    totalSupplyBefore: BigNumber;
    signerDetailsBefore?: SignerDetails;
  }
}
