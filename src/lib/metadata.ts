import { BCS, TxnBuilderTypes } from "aptos";

type Any = any;
type vector<T> = T[];

class Option<T> {
  constructor(public readonly raw: BCS.Bytes) {}

  static deserialize<T>(deserializer: BCS.Deserializer): Option<T> {
    const raw = deserializer.deserializeBytes();
    return new Option<T>(raw);
  }
}

export class Metadata {
  constructor(
    public readonly name: string,
    public readonly upgrade_policy: UpgradePolicy,
    public readonly upgrade_number: number,
    public readonly source_digest: string,
    public readonly manifest: BCS.Bytes,
    public readonly modules: vector<Module>,
    public readonly dependencies: vector<Dependency>,
    public readonly extension: Option<Any>
  ) {}

  static deserialize(deserializer: BCS.Deserializer): Metadata {
    const name = deserializer.deserializeStr();
    const upgrade_policy = UpgradePolicy.deserialize(deserializer);
    const upgrade_number = deserializer.deserializeU64();
    const source_digest = deserializer.deserializeStr();
    const manifest = deserializer.deserializeBytes();
    const modules = BCS.deserializeVector(deserializer, Module);
    const dependencies = BCS.deserializeVector(deserializer, Dependency);
    const extension = Option.deserialize<Any>(deserializer);
    return new Metadata(name, upgrade_policy, Number(upgrade_number), source_digest, manifest, modules, dependencies, extension);
  }
}

class UpgradePolicy {
  constructor(public readonly policy: number) {}

  static deserialize(deserializer: BCS.Deserializer): UpgradePolicy {
    const policy = deserializer.deserializeU8();
    return new UpgradePolicy(policy);
  }
}

class Module {
  constructor(public readonly name: string, public readonly source: BCS.Bytes, public readonly source_map: BCS.Bytes, public readonly extension: Option<Any>) {}

  static deserialize(deserializer: BCS.Deserializer): Module {
    const name = deserializer.deserializeStr();
    const source = deserializer.deserializeBytes();
    const source_map = deserializer.deserializeBytes();
    const extension = Option.deserialize<Any>(deserializer);
    return new Module(name, source, source_map, extension);
  }
}

class Dependency {
  constructor(public readonly account: TxnBuilderTypes.AccountAddress, public readonly package_name: string) {}

  static deserialize(deserializer: BCS.Deserializer): Dependency {
    const account = TxnBuilderTypes.AccountAddress.deserialize(deserializer);
    const package_name = deserializer.deserializeStr();
    return new Dependency(account, package_name);
  }
}
