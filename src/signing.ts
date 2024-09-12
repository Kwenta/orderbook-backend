import {
  checksumAddress,
  encodeAbiParameters,
  encodePacked,
  keccak256,
  recoverAddress,
  toBytes,
  zeroAddress,
} from "viem";
import { Order } from "./schemas";
import { ORDER_TYPEHASH } from "./constants";

const DOMAIN_HASH = keccak256(
  toBytes(
    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
  )
);

const NAME_HASH = keccak256(toBytes("SyntheticPerpetualFutures"));
const VERSION_HASH = keccak256(toBytes("1"));

const getDomain = (chainId: bigint, contractAddress: `0x${string}`) => {
  return keccak256(
    encodeAbiParameters(
      [
        { type: "bytes32" },
        { type: "bytes32" },
        { type: "bytes32" },
        { type: "uint256" },
        { type: "address" },
      ],
      [DOMAIN_HASH, NAME_HASH, VERSION_HASH, chainId, contractAddress]
    ) as `0x${string}`
  );
};

const hashOfOrder = (
  order: Order,
  contractAddress: `0x${string}`,
  chainId: bigint
) => {
  const domainSeparator = getDomain(chainId, contractAddress);

  const digest = keccak256(
    encodePacked(
      ["bytes1", "bytes1", "bytes32", "bytes32"],
      [
        "0x19",
        "0x01",
        domainSeparator,
        keccak256(
          encodeAbiParameters(
            [
              { type: "bytes32" },
              { type: "uint128" },
              { type: "uint128" },
              { type: "address" },
              { type: "int128" },
              { type: "uint256" },
              { type: "bool" },
              { type: "uint256" },
              { type: "uint256" },
              { type: "bytes32" },
            ],
            [
              ORDER_TYPEHASH,
              order.accountId,
              order.marketId,
              order.relayer,
              order.amount,
              order.price,
              order.limitOrderMaker,
              order.expiration,
              order.nonce,
              order.trackingCode,
            ]
          )
        ),
      ]
    ) as `0x${string}`
  );

  return digest;
};

const checkSignatureOfOrder = async (
  order: Order,
  contractAddress: `0x${string}`,
  chainId: bigint,
  user: `0x${string}`,
  signature: `0x${string}`
) => {
  const hash = hashOfOrder(order, contractAddress, chainId);
  const signer = await recoverAddress({ hash, signature });

  return checksumAddress(signer) === checksumAddress(user);
};
