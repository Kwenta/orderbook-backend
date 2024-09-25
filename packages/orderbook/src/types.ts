import type { Address, Prettify } from 'viem'
import type { ZodEffects, ZodString, z } from 'zod'
import type { markets } from './constants'
import type {
	conditionSchema,
	metadataSchema,
	orderSchema,
	tradeSchema,
	traderSchema,
} from './schemas'

export type Market = (typeof markets)[number]
export type MarketId = Market['id']

export type Sizes =
	| 8
	| 16
	| 24
	| 32
	| 40
	| 48
	| 56
	| 64
	| 72
	| 80
	| 88
	| 96
	| 104
	| 112
	| 120
	| 128
	| 136
	| 144
	| 152
	| 160
	| 168
	| 176
	| 184
	| 192
	| 200
	| 208
	| 216
	| 224
	| 232
	| 240
	| 248
	| 256

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

export type uint = {
	[T in Sizes]: bigint & { _type: `uint${T}` }
}

export type int = {
	[T in Sizes]: bigint & { _type: `int${T}` }
}

export type ZodUint<T extends keyof uint> = ZodEffects<
	ZodEffects<ZodString, bigint, string>,
	uint[T],
	string
>
export type ZodInt<T extends keyof int> = ZodEffects<
	ZodEffects<ZodString, bigint, string>,
	int[T],
	string
>

export type Metadata = z.infer<typeof metadataSchema>
export type Trader = z.infer<typeof traderSchema>
export type Trade = z.infer<typeof tradeSchema>
export type Condition = z.infer<typeof conditionSchema>

export type Order = z.infer<typeof orderSchema>
