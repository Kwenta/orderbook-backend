import { keccak256, toBytes, stringToHex } from "viem";

export const TRACKING_CODE = stringToHex("KWENTA", { size: 32 });

export const markets = ["test-market"] as const;

export type Market = (typeof markets)[number];

export const ORDER_TYPEHASH = keccak256(
  toBytes(
    "SignedOrderRequest(uint128 accountId,uint128 marketId,address relayer,int128 amount,uint256 price,limitOrderMaker bool,expiration uint256,nonce uint256,trackingCode bytes32)"
    // "SignedOrderRequest(uint128 accountId,uint128 marketId,address relayer,int128 amount,uint256 price,bool limitOrderMaker,uint256 expiration,uint256 nonce,bytes32 trackingCode)"
  )
);
