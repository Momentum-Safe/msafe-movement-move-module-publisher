export function shortAddress(address: string | undefined, start?: number, end?: number) {
  if (!address) {
    return "";
  }
  return `${address.substring(0, start || 6)}...${address.substring(address.length - (end || 4), address.length)}`;
}
