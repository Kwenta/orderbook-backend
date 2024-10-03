import { z } from '@hono/zod-openapi'
import { OrderType } from '../types'
import { uint128 } from './solidity'
import * as _solidity from './solidity'

export * as http from './http'

export const solidity = _solidity

export const orderId = z.string()
export const marketId = solidity.uint128()

export const metadataSchema = z.object({
	// timestamp when the order was created
	genesis: solidity.uint256(),
	// timestamp when the order will expire
	expiration: solidity.uint256(),
	// tracking code for the order
	trackingCode: solidity.bytes32(),
	// address of the referrer
	referrer: solidity.address(),
})

export const traderSchema = z.object({
	// unique order identifier for a given account
	nonce: solidity.uint256(),
	// unique account identifier
	accountId: solidity.uint128(),
	// address of the trade signer which:
	//  - must be the account owner
	//  - must satisfy account-specified permissions
	signer: solidity.address(),
})

export const tradeSchema = z.object({
	// type of order
	t: z.enum(Object.values(OrderType).map((x) => x.toString()) as [string, ...string[]]),
	// unique market identifier
	marketId: solidity.uint128(),
	// size of the trade:
	//  - measured in the market's underlying asset
	//  - sign indicates the direction of the trade
	size: solidity.int128(),
	// indicates the price of the trade:
	//  - measured in the asset used to quote the market's underlying asset
	//  - logic varies depending on the order type
	price: solidity.uint256(),
})

export const conditionSchema = z.object({
	// address of the contract to staticcall
	target: solidity.address(),
	// identifier of the function to call
	selector: solidity.FunctionSelector,
	// data to pass to the function
	data: solidity.hexString(),
	// expected return value
	expected: solidity.bytes32(),
})

export const orderSchema = z.object({
	metadata: metadataSchema,
	trader: traderSchema,
	trade: tradeSchema,
	conditions: z.array(conditionSchema),
})

export const signedOrderSchema = z
	.object({
		id: z.string().describe('The unique identifier of the order'),
		order: orderSchema,
		user: solidity.address(),
		signature: solidity.hexString(64),
	})
	.openapi('SignedOrder')

export const unsignedOrderSchema = z
	.object({
		id: z.string().describe('The unique identifier of the order'),
		order: orderSchema,
		user: solidity.address(),
		signature: solidity.Signature,
	})
	.openapi('UnsignedOrder')

export const bookSchema = z.object({ marketId, orders: z.array(orderSchema) }).openapi('Book')

export const marketSchema = z.object({ id: marketId, symbol: z.string() }).openapi('Market')
export const marketsSchema = z.array(marketSchema).openapi('Markets')
export const userNonceSchema = z
	.object({
		nonce: solidity.uint256(),
		lastSeen: z.date(),
		user: solidity.address(),
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
