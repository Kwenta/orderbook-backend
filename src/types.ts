import { Address } from "viem";
import type { markets } from "./constants";

export type Market = (typeof markets)[number];
export type MarketId = Market["id"];

export type Sizes = 8 | 16 | 24 | 32 | 40 | 48 | 56 | 64 | 72 | 80 | 88 | 96 | 104 | 112 | 120 | 128 | 136 | 144 | 152 | 160 | 168 | 176 | 184 | 192 | 200 | 208 | 216 | 224 | 232 | 240 | 248 | 256;

export const OrderType = {
  // conditional execution:
  //  - buy   @ QUOTE != 0
  //  - sell  @ QUOTE != 0
  //
  // side effects:
  //  - LOB depth consumed if available; order "killed" otherwise
  MARKET: 1,
  // conditional execution:
  //  - buy   @ QUOTE <= LIMIT price
  //  - sell  @ QUOTE >= LIMIT price
  //
  // side effects:
  //  - LOB depth increases when condition not satisfied
  //  - LOB depth decreases when condition satisfied
  LIMIT: 2,
  // conditional execution:
  //  - buy   @ QUOTE >= STOP price
  //  - sell  @ QUOTE <= STOP price
  //
  // side effects:
  // - LOB depth unchanged until condition satisfied
  // - LOB depth decreases when condition satisfied
  STOP: 3,
  // conditional execution:
  //  - buy   @ QUOTE >= STOP price && QUOTE <= LIMIT price
  //  - sell  @ QUOTE <= STOP price && QUOTE >= LIMIT price
  //
  // side effects:
  // - LOB depth unchanged when STOP condition is not satisfied
  // - LOB depth increases when STOP condition satisfied but not LIMIT
  // - LOB depth decreases when both conditions satisfied
  STOP_LIMIT: 4,
} as const;

type uint256 = bigint & { _type: "uint256" };
type uint128 = bigint & { _type: "uint128" };
type int128 = bigint & { _type: "int128" };
type bytes32 = string & { _type: "bytes32" };
type bytes4 = string & { _type: "bytes4" };
type bytes = string & { _type: "bytes" };

export type Metadata = {
  // timestamp when the order was created
  genesis: uint256;
  // timestamp when the order will expire
  expiration: uint256;
  // tracking code for the order
  trackingCode: bytes32;
  // address of the referrer
  referrer: Address;
};

export type Trader = {
  // unique order identifier for a given account
  nonce: uint256;
  // unique account identifier
  accountId: uint128;
  // address of the trade signer which:
  //  - must be the account owner
  //  - must satisfy account-specified permissions
  signer: Address;
};

export type Trade = {
  // type of order
  t: (typeof OrderType)[keyof typeof OrderType];
  // unique market identifier
  marketId: uint128;
  // size of the trade:
  //  - measured in the market's underlying asset
  //  - sign indicates the direction of the trade
  size: int128;
  // indicates the price of the trade:
  //  - measured in the asset used to quote the market's underlying asset
  //  - logic varies depending on the order type
  price: uint256;
};

export type Condition = {
  // address of the contract to staticcall
  target: Address;
  // identifier of the function to call
  selector: bytes4;
  // data to pass to the function
  data: bytes;
  // expected return value
  expected: bytes32;
};

export type Order = {
  metadata: Metadata;
  trader: Trader;
  trade: Trade;
  conditions: Condition[];
};
