import BigNumber from "bignumber.js";

export interface CoinTextProps {
  value: string | number | bigint;
  type?: string;
}

export default function CoinText(props: CoinTextProps) {
  const coinText = new BigNumber(props.value.toString() || 0).div(1e8).toString();
  const coinType = props.type ? props.type : "APT";
  return <span>{`${coinText} ${coinType}`}</span>;
}
