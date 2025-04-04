import { BCS } from "aptos";
import { Metadata } from "./metadata";
import { MoveParser } from "./move";

export const MSAFE = {
  network: {
    mainnet: {
      node: "https://mainnet.movementnetwork.xyz/v1",
    },
    testnet: {
      node: "https://testnet.movementnetwork.xyz/v1",
    },
    devnet: {
      node: "https://devnet.movementnetwork.xyz/v1",
    },
  },
  aptos: {
    coin: "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>",
    entryFunctions: {
      publish: {
        address: "0x0000000000000000000000000000000000000000000000000000000000000001",
        module: "code",
        method: "publish_package_txn",
      },
      resourceAccount: {
        address: "0x0000000000000000000000000000000000000000000000000000000000000001",
        module: "resource_account",
        method: "create_resource_account_and_publish_package",
      },
    },
  },
  move: {
    metadataFile: "package-metadata.bcs",
  },
};

export interface TransactionPreviewResult {
  metadata: Metadata;
}

export async function previewTransaction(files: File[]): Promise<TransactionPreviewResult> {
  const moveParser = new MoveParser(files);
  const movePackage = await moveParser.parsePackage();
  const moveBytecode = await moveParser.parseBytecode(movePackage.metadata);
  console.log(movePackage);
  console.log(moveBytecode);
  return new Promise((resolve) => {});
}

function serializeCodeBytes(bytecode: ArrayBuffer[]) {
  const bytes = (buf: ArrayBuffer) => ({
    serialize(serializer: BCS.Serializer) {
      serializer.serializeBytes(new Uint8Array(buf));
    },
  });
  const codeSerializer = new BCS.Serializer();
  BCS.serializeVector(
    bytecode.map((code) => bytes(code)),
    codeSerializer
  );
  return codeSerializer.getBytes();
}

export async function readFile(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      if (fileReader.result instanceof ArrayBuffer) {
        resolve(fileReader.result);
      }
    };
    fileReader.readAsArrayBuffer(file);
  });
}
