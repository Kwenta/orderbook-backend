import { keccak256, toBytes, stringToHex } from "viem";

export const TRACKING_CODE = stringToHex("KWENTA", { size: 32 });

export const markets = ["test-market"] as const;

export const ORDER_TYPEHASH = keccak256(
  toBytes(
    "SignedOrderRequest(uint128 accountId,uint128 marketId,address relayer,int128 amount,uint256 price,limitOrderMaker bool,expiration uint256,nonce uint256,trackingCode bytes32)"
    // "SignedOrderRequest(uint128 accountId,uint128 marketId,address relayer,int128 amount,uint256 price,bool limitOrderMaker,uint256 expiration,uint256 nonce,bytes32 trackingCode)"
  )
);

export const DOMAIN_HASH = keccak256(
  toBytes(
    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
  )
);

export const NAME_HASH = keccak256(toBytes("SyntheticPerpetualFutures"));
export const VERSION_HASH = keccak256(toBytes("1"));
