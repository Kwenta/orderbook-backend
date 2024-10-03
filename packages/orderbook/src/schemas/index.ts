import { z } from '@hono/zod-openapi'
import { OrderType } from '../types'
import * as _solidity from './solidity'

export * as http from './http'

export const solidity = _solidity

export const orderId = z.string()
export const marketId = solidity.uint128('The unique market identifier')

export const metadataSchema = z.object({
	genesis: solidity.uint256('The timestamp when the order was created'),
	expiration: solidity.uint256('The timestamp when the order will expire'),
	trackingCode: solidity.bytes32('The tracking code for the order'),
	referrer: solidity.address('The address of the referrer'),
})

export const traderSchema = z.object({
	nonce: solidity.uint256('The unique order identifier for a given account'),
	accountId: solidity.uint128('The unique account identifier'),
	signer: solidity.address(
		'The address of the trade signer, which must be the account owner or a delegate'
	),
})

export const tradeSchema = z.object({
	t: z.nativeEnum(OrderType).describe('The type of order'),
	marketId: solidity.uint128('The unique market identifier'),
	size: solidity.int128(
		"The size of the trade, measured in the market's underlying asset. A positive value indicates a buy, while a negative value indicates a sell"
	),
	price: solidity.uint256(
		'The price of the trade, measured in the quote asset of the market. For limit orders, this is the limit price'
	),
})

export const conditionSchema = z.object({
	target: solidity.address('The address of the contract to call'),
	selector: solidity.FunctionSelector('The function selector to call'),
	data: solidity.hexString(1000, false, 'The data to pass to the function'),
	expected: solidity.bytes32('The expected return value'),
})

export const orderSchema = z.object({
	metadata: metadataSchema.describe('The metadata for the order'),
	trader: traderSchema.describe('The trader who created the order'),
	trade: tradeSchema.describe('The trade that the order represents'),
	conditions: z.array(conditionSchema).describe('The conditions that must be met for the order'),
})

export const signedOrderSchema = z
	.object({
		id: z.string().describe('The unique identifier of the order'),
		order: orderSchema.describe('The order data'),
		user: solidity.address('The address of the user who signed the order'),
		signature: solidity.hexString(64, true, 'The signature of the order'),
	})
	.openapi('SignedOrder')

export const unsignedOrderSchema = z
	.object({
		id: z.string().describe('The unique identifier of the order'),
		order: orderSchema.describe('The order data'),
		user: solidity.address('The address of the user who signed the order'),
	})
	.openapi('UnsignedOrder')

export const bookSchema = z.object({ marketId, orders: z.array(orderSchema) }).openapi('Book')

export const marketSchema = z
	.object({ id: marketId, symbol: z.string().describe('The symbol for the asset of the market') })
	.openapi('Market')
export const marketsSchema = z.array(marketSchema).openapi('Markets')
export const userNonceSchema = z
	.object({
		nonce: solidity.uint256('The unique order identifier for a given account'),
		lastSeen: z.date().describe('The timestamp when the nonce was last seen'),
		user: solidity.uint128('The accountId of the user'),
	})
	.openapi('UserNonceData')

export const paginationSchema = z.object({
	offset: z
		.string()
		.optional()
		.default('0')
		.transform((x) => (x ? Number.parseInt(x) : 0))
		.describe('The offset to start the page from'),
	limit: z
		.string()
		.optional()
		.default('10')
		.transform((x) => (x ? Number.parseInt(x) : 10))
		.describe('The number of items to return'),
})

export const marketPaginationSchema = paginationSchema.merge(z.object({ marketId }))
