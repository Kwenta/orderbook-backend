import type { ZodBigInt, ZodEffects, ZodNumber, ZodString, ZodUnion, z } from 'zod'
import type {
	conditionSchema,
	metadataSchema,
	orderSchema,
	tradeSchema,
	traderSchema,
} from './schemas'

export type Market = { id: uint[128]; symbol: string }
export type MarketId = Market['id']

export type HexString = `0x${string}`

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

export type BytesSizes =
	| 1
	| 2
	| 3
	| 4
	| 5
	| 6
	| 7
	| 8
	| 9
	| 10
	| 11
	| 12
	| 13
	| 14
	| 15
	| 16
	| 17
	| 18
	| 19
	| 20
	| 21
	| 22
	| 23
	| 24
	| 25
	| 26
	| 27
	| 28
	| 29
	| 30
	| 31
	| 32

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

export type bytes = {
	[T in BytesSizes]: HexString & { _type: `bytes${T}` }
}

export type ZodUint<T extends keyof uint> = ZodEffects<
	ZodEffects<ZodUnion<[ZodString, ZodNumber, ZodBigInt]>, bigint, number | string | bigint>,
	uint[T],
	string
>
export type ZodInt<T extends keyof int> = ZodEffects<
	ZodEffects<ZodUnion<[ZodString, ZodNumber, ZodBigInt]>, bigint, number | string | bigint>,
	int[T],
	string
>

export type ZodBytes<T extends keyof bytes> = ZodEffects<
	ZodEffects<ZodString, HexString, string>,
	bytes[T],
	string
>

export type Metadata = z.infer<typeof metadataSchema>
export type Trader = z.infer<typeof traderSchema>
export type Trade = z.infer<typeof tradeSchema>
export type Condition = z.infer<typeof conditionSchema>

export type Order = z.infer<typeof orderSchema>

export type AccountId = Trader['accountId']
