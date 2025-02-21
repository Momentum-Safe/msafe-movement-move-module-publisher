import { NetworkName } from "@aptos-labs/wallet-adapter-react";
import { WalletContextState } from "@aptos-labs/wallet-adapter-react/src/useWallet";
import { AptosClient, BCS, TxnBuilderTypes } from "aptos";
import { Metadata } from "./metadata";
import { MSAFE, readFile } from "./msafe";
import { RawTransactionBuilder } from "./transaction";

export interface MovePackage {
  raw: ArrayBuffer;
  metadata: Metadata;
  bytecode: ArrayBuffer[];
}

export class MoveParser {
  public readonly files: File[];
  private static METADATA_FILE = "package-metadata.bcs";

  constructor(files: File[]) {
    this.files = files;
  }

  public async parsePackage(): Promise<MovePackage> {
    const metadataFile = this.files.find((f) => f.webkitRelativePath.endsWith(MoveParser.METADATA_FILE));
    if (!metadataFile) {
      return new Promise((resolve, reject) => reject("No metadata found."));
    }

    const raw = await readFile(metadataFile);
    const metadata = Metadata.deserialize(new BCS.Deserializer(new Uint8Array(raw)));
    const bytecode = await this.parseBytecode(metadata);
    return new Promise((resolve) => {
      resolve({
        raw: raw,
        metadata: metadata,
        bytecode: bytecode,
      });
    });
  }

  public async parseBytecode(metadata: Metadata): Promise<ArrayBuffer[]> {
    const bytecodePath = `build/${metadata.name}/bytecode_modules/`;
    const bytecodes: ArrayBuffer[] = [];
    const byteFiles = metadata.modules.map((m) => this.files.find((f) => f.webkitRelativePath === `${bytecodePath}${m.name}.mv`) as File);
    for (let i = 0; i < byteFiles.length; i++) {
      const file = byteFiles[i];
      bytecodes.push(await readFile(file));
    }
    return new Promise((resolve) => resolve(bytecodes));
  }
}

export class MovePublisher {
  private readonly wallet: WalletContextState;
  private readonly movePackage: MovePackage;
  private readonly aptosClient: AptosClient;

  constructor(wallet: WalletContextState, movePackage: MovePackage) {
    this.wallet = wallet;
    this.movePackage = movePackage;
    if (!wallet.network) {
      throw new Error("no wallet network info");
    }
    this.aptosClient = new AptosClient(MSAFE.network[wallet.network.name.toLowerCase() as NetworkName].node);
  }

  public async buildPublishModuleTransaction(): Promise<TxnBuilderTypes.RawTransaction> {
    return new RawTransactionBuilder(
      this.wallet,
      MSAFE.aptos.entryFunctions.publish.address,
      MSAFE.aptos.entryFunctions.publish.module,
      MSAFE.aptos.entryFunctions.publish.method
    ).buildTransaction([BCS.bcsSerializeBytes(new Uint8Array(this.movePackage.raw)), this.serializeCodeBytes()]);
  }

  public async buildPublishWithResourceAccountTransaction(seed: string, seedEncoding: string): Promise<TxnBuilderTypes.RawTransaction> {
    return new RawTransactionBuilder(
      this.wallet,
      MSAFE.aptos.entryFunctions.resourceAccount.address,
      MSAFE.aptos.entryFunctions.resourceAccount.module,
      MSAFE.aptos.entryFunctions.resourceAccount.method
    ).buildTransaction([
      BCS.bcsSerializeBytes(seedEncoding === "Utf8" ? new TextEncoder().encode(seed) : this.hexToBytes(seed)),
      BCS.bcsSerializeBytes(new Uint8Array(this.movePackage.raw)),
      this.serializeCodeBytes(),
    ]);
  }

  public async signPublishModuleTransaction() {
    return new RawTransactionBuilder(
      this.wallet,
      MSAFE.aptos.entryFunctions.publish.address,
      MSAFE.aptos.entryFunctions.publish.module,
      MSAFE.aptos.entryFunctions.publish.method
    ).signTransaction([new Uint8Array(this.movePackage.raw), this.movePackage.bytecode.map((b) => new TxnBuilderTypes.Module(new Uint8Array(b)).code)]);
  }

  public async signPublishWithResourceAccountTransaction(seed: string, seedEncoding: string) {
    return new RawTransactionBuilder(
      this.wallet,
      MSAFE.aptos.entryFunctions.resourceAccount.address,
      MSAFE.aptos.entryFunctions.resourceAccount.module,
      MSAFE.aptos.entryFunctions.resourceAccount.method
    ).signTransaction([
      seedEncoding === "Utf8" ? new TextEncoder().encode(seed) : this.hexToBytes(seed),
      new Uint8Array(this.movePackage.raw),
      this.movePackage.bytecode.map((b) => new TxnBuilderTypes.Module(new Uint8Array(b)).code),
    ]);
  }

  private serializeCodeBytes() {
    const bytes = (buf: ArrayBuffer) => ({
      serialize(serializer: BCS.Serializer) {
        serializer.serializeBytes(new Uint8Array(buf));
      },
    });
    const codeSerializer = new BCS.Serializer();
    BCS.serializeVector(
      this.movePackage.bytecode.map((code) => bytes(code)),
      codeSerializer
    );
    return codeSerializer.getBytes();
  }

  private hexToBytes(hex: string): Uint8Array {
    const arrayBuffer = new Uint8Array(hex.length / 2);

    for (let i = 0; i < hex.length; i += 2) {
      const byteValue = parseInt(hex.substr(i, 2), 16);
      if (isNaN(byteValue)) {
        throw "Invalid hexString";
      }
      arrayBuffer[i / 2] = byteValue;
    }

    return arrayBuffer;
  }
}
