import { checksumAddress, hashTypedData, recoverTypedDataAddress } from 'viem'
import { chainId, verifyingContract } from './env'
import type { Order as FullOrder, HexString, LimitOrder, int } from './types'

const types = {
	Order: [
		{ name: 'metadata', type: 'Metadata' },
		{ name: 'trader', type: 'Trader' },
		{ name: 'trade', type: 'Trade' },
		{ name: 'conditions', type: 'Condition[]' },
	],
	Metadata: [
		{ name: 'genesis', type: 'uint256' },
		{ name: 'expiration', type: 'uint256' },
		{ name: 'trackingCode', type: 'bytes32' },
		{ name: 'referrer', type: 'address' },
	],
	Trader: [
		{ name: 'nonce', type: 'uint256' },
		{ name: 'accountId', type: 'uint128' },
		{ name: 'signer', type: 'address' },
	],
	Trade: [
		{ name: 't', type: 'uint8' },
		{ name: 'marketId', type: 'uint128' },
		{ name: 'size', type: 'int128' },
		{ name: 'price', type: 'uint256' },
	],
	Condition: [
		{ name: 'target', type: 'address' },
		{ name: 'selector', type: 'bytes4' },
		{ name: 'data', type: 'bytes' },
		{ name: 'expected', type: 'bytes32' },
	],
} as const

const domain = {
	chainId,
	verifyingContract,
	name: 'SyntheticPerpetualFutures',
	version: '1',
} as const

const typedData = (order: FullOrder) =>
	({ domain, types, primaryType: 'Order', message: order }) as const

export const hashOfOrder = (order: FullOrder) => {
	return hashTypedData(typedData(order))
}

const checkSignatureOfOrder = async (order: FullOrder, user: HexString, signature: HexString) => {
	const signer = await recoverTypedDataAddress({ ...typedData(order), signature })
	return checksumAddress(signer) === checksumAddress(user)
}

export const checkOrderSignature = async (order: LimitOrder) => {
	return checkSignatureOfOrder(order.order, order.order.trader.signer, order.signature)
}

export const checkDeleteSignature = async (lo: LimitOrder) => {
	const newOrder = structuredClone(lo)
	newOrder.order.trade.size = BigInt(0) as int[128]
	return await checkOrderSignature(newOrder)
}
