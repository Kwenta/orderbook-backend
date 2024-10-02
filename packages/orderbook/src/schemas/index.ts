import { z } from '@hono/zod-openapi'
import { checksumAddress, isAddress } from 'viem'
import * as viem from 'viem'
import type { ZodSchema } from 'zod'
import { OrderType, type Sizes, type ZodInt, type ZodUint, type int, type uint } from '../types'

export const orderId = z.string().openapi({
	example: '123',
})

export const hexString = z
	.string()
	.refine((s) => s.startsWith('0x'))
	.transform((s) => s as `0x${string}`)

export const zodAddress = () =>
	hexString.refine((s) => isAddress(s)).transform((s) => checksumAddress(s))

export const uintSchema = (n: Sizes = 256): ZodUint<keyof uint> => {
	if (n < 0 || n > 256) throw new Error('Invalid uint size')
	const maxValue = viem[`maxUint${n}`]
	return z
		.string()
		.transform(BigInt)
		.refine(
			(x) => x >= BigInt(0) && x < maxValue,
			`Value must be between 0 and ${maxValue}`
		) as ZodUint<keyof uint>
}

export const uint8 = () => uintSchema(8) as ZodUint<8>
export const uint128 = () => uintSchema(128) as ZodUint<128>
export const uint256 = () => uintSchema(256) as ZodUint<256>

export const intSchema = (n: Sizes = 256): ZodInt<keyof int> => {
	if (n < 0 || n > 256) throw new Error('Invalid uint size')
	const maxValue = viem[`maxInt${n}`]
	const minValue = viem[`minInt${n}`]
	return z
		.string()
		.transform(BigInt)
		.refine(
			(x) => x > minValue && x < maxValue,
			`Value must be between ${minValue} and ${maxValue}`
		) as ZodInt<keyof int>
}

export const int8 = () => intSchema(8) as ZodInt<8>
export const int128 = () => intSchema(128) as ZodInt<128>
export const int256 = () => intSchema(256) as ZodInt<256>

export const marketId = uint128()

export const metadataSchema = z.object({
	// timestamp when the order was created
	genesis: uint256(),
	// timestamp when the order will expire
	expiration: uint256(),
	// tracking code for the order
	trackingCode: hexString,
	// address of the referrer
	referrer: zodAddress(),
})

export const traderSchema = z.object({
	// unique order identifier for a given account
	nonce: uint256(),
	// unique account identifier
	accountId: uint128(),
	// address of the trade signer which:
	//  - must be the account owner
	//  - must satisfy account-specified permissions
	signer: zodAddress(),
})

export const tradeSchema = z.object({
	// type of order
	t: z.enum(Object.values(OrderType).map((x) => x.toString()) as [string, ...string[]]),
	// unique market identifier
	marketId: uint128(),
	// size of the trade:
	//  - measured in the market's underlying asset
	//  - sign indicates the direction of the trade
	size: int128(),
	// indicates the price of the trade:
	//  - measured in the asset used to quote the market's underlying asset
	//  - logic varies depending on the order type
	price: uint256(),
})

export const conditionSchema = z.object({
	// address of the contract to staticcall
	target: zodAddress(),
	// identifier of the function to call
	selector: hexString.refine((s) => s.length === 10),
	// data to pass to the function
	data: hexString,
	// expected return value
	expected: hexString.refine((s) => s.length === 66),
})

export const orderSchema = z.object({
	metadata: metadataSchema,
	trader: traderSchema,
	trade: tradeSchema,
	conditions: z.array(conditionSchema),
})

export const paginationSchema = z.object({
	offset: z.string().transform((x) => (x ? Number.parseInt(x) : 0)),
	limit: z.string().transform((x) => (x ? Number.parseInt(x) : 10)),
})

export const bodySchema = (schema: z.ZodSchema) => ({
	content: {
		'application/json': {
			schema,
		},
	},
})

export const okSchema = <T extends z.ZodSchema>(
	schema: T,
	description = ''
): {
	content: {
		'application/json': {
			schema: T
		}
	}
	description: string
} => ({
	content: {
		'application/json': {
			schema,
		},
	},
	description,
})

export const notFoundSchema = {
	content: {
		'application/json': {
			schema: z.object({
				message: z.string(),
			}),
		},
	},
	description: 'The requested resource was not found',
}

export const badRequestSchema = {
	content: {
		'application/json': {
			schema: z.object({
				message: z.string(),
			}),
		},
	},
	description: 'The request was malformed',
}

export const internalServerErrorSchema = {
	content: {
		'application/json': {
			schema: z.object({
				message: z.string(),
			}),
		},
	},
	description: 'Something went wrong internally',
}

export type Body<T extends { body: { content: { 'application/json': { schema: ZodSchema } } } }> =
	z.infer<T['body']['content']['application/json']['schema']>
