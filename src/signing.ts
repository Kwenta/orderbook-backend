import { checksumAddress, hashTypedData, recoverTypedDataAddress } from "viem";
import type { Order as FullOrder } from "./types";

export const orderTypes = {
  Order: [
    { name: "metadata", type: "Metadata" },
    { name: "trader", type: "Trader" },
    { name: "trade", type: "Trade" },
    { name: "conditions", type: "Condition[]" },
  ],
  Metadata: [
    { name: "genesis", type: "uint256" },
    { name: "expiration", type: "uint256" },
    { name: "trackingCode", type: "bytes32" },
    { name: "referrer", type: "address" },
  ],
  Trader: [
    { name: "nonce", type: "uint256" },
    { name: "accountId", type: "uint128" },
    { name: "signer", type: "address" },
  ],
  Trade: [
    { name: "t", type: "uint8" },
    { name: "marketId", type: "uint128" },
    { name: "size", type: "int128" },
    { name: "price", type: "uint256" },
  ],
  Condition: [
    { name: "target", type: "address" },
    { name: "selector", type: "bytes4" },
    { name: "data", type: "bytes" },
    { name: "expected", type: "bytes32" },
  ],
};

export const domain = (chainId: bigint, contractAddress: `0x${string}`) => ({
  chainId: Number(chainId),
  verifyingContract: contractAddress,
  name: "SyntheticPerpetualFutures",
  version: "1",
});

export const hashOfOrder = (order: FullOrder, contractAddress: `0x${string}`, chainId: bigint) => {
  return hashTypedData({
    domain: domain(chainId, contractAddress),
    types: orderTypes,
    primaryType: "Order",
    message: {
      metadata: order.metadata,
      trader: order.trader,
      trade: order.trade,
      conditions: order.conditions,
    },
  });
};

export const checkSignatureOfOrder = async (order: FullOrder, contractAddress: `0x${string}`, chainId: bigint, user: `0x${string}`, signature: `0x${string}`) => {
  const signer = await recoverTypedDataAddress({
    domain: domain(chainId, contractAddress),
    types: orderTypes,
    primaryType: "Order",
    message: {
      metadata: order.metadata,
      trader: order.trader,
      trade: order.trade,
      conditions: order.conditions,
    },
    signature,
  });
  return checksumAddress(signer) === checksumAddress(user);
};
