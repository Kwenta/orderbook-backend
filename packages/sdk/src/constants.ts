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
} as const

export const orderTypes = {
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

export const TRACKING_CODE = 'KWENTA'
export const ORDER_EXPIRATION_TIME = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
