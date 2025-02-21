import { NetworkName } from "@aptos-labs/wallet-adapter-react";
import { WalletContextState } from "@aptos-labs/wallet-adapter-react/src/useWallet";
import { AptosClient, HexString, TxnBuilderTypes } from "aptos";
import { MSAFE } from "./msafe";

export interface AccountInfo {
  threshold: number;
  nonce: string;
  public_keys: string[];
  owners: string[];
}

export class RawTransactionBuilder {
  private readonly wallet: WalletContextState;
  private readonly aptosClient: AptosClient;
  private readonly deployer: string;
  private readonly module: string;
  private readonly func: string;

  private chainId: number = 0;
  private sequenceNumber: bigint = BigInt(0);
  private gasPrice: bigint = BigInt(0);
  private maxGas: bigint = BigInt(2000000);
  private expiration = 60 * 60 * 24 * 7; // default expiration for one week

  constructor(wallet: WalletContextState, deployer: string, module: string, func: string) {
    this.wallet = wallet;
    if (!wallet.network) {
      throw new Error("no wallet network info");
    }
    this.aptosClient = new AptosClient(MSAFE.network[wallet.network.name.toLowerCase() as NetworkName].node);
    this.deployer = deployer;
    this.module = module;
    this.func = func;
  }

  public async buildTransaction(args: Uint8Array[], type_args = []): Promise<TxnBuilderTypes.RawTransaction> {
    this.chainId = await this.aptosClient.getChainId();
    this.sequenceNumber = await this.getSequenceNumber();
    return new Promise((resolve) => {
      return resolve(this.makeRawTransaction(args, type_args));
    });
  }

  public async signTransaction(args: any[], type_args = []) {
    return this.wallet.signAndSubmitTransaction({
      data: {
        function: `${this.deployer}::${this.module}::${this.func}`,
        typeArguments: type_args,
        functionArguments: args,
      },
    });
  }

  private makeRawTransaction(args: Uint8Array[], type_args = []): TxnBuilderTypes.RawTransaction {
    return new TxnBuilderTypes.RawTransaction(
      TxnBuilderTypes.AccountAddress.fromHex(this.getAccountAddress()),
      this.sequenceNumber,
      new TxnBuilderTypes.TransactionPayloadEntryFunction(
        TxnBuilderTypes.EntryFunction.natural(`${this.deployer}::${this.module}`, this.func, type_args, args)
      ),
      this.maxGas,
      this.gasPrice,
      this.getExpiration(),
      new TxnBuilderTypes.ChainId(this.chainId)
    );
  }

  private async getSequenceNumber(): Promise<bigint> {
    const account = await this.aptosClient.getAccount(this.getAccountAddress());
    return new Promise((resolve) => resolve(BigInt(account.sequence_number)));
  }

  private getExpiration(): bigint {
    return BigInt(Math.floor(Date.now() / 1000) + this.expiration);
  }

  private getAccountAddress(): HexString {
    if (!this.wallet.account) {
      throw new Error("no account address info");
    }
    return HexString.ensure(this.wallet.account?.address);
  }
}
