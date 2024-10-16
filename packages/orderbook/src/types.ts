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

export type SupportedChains = 8453

export type HexString = `0x${string}`

export type IntSizes = 8 | 128 | 256
export type BytesSizes = 4 | 32

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
	[T in IntSizes]: bigint & { _type?: `uint${T}` }
}

export type int = {
	[T in IntSizes]: bigint & { _type?: `int${T}` }
}

export type bytes = {
	[T in BytesSizes]: HexString & { _type?: `bytes${T}` }
}

type ZodBigIntIsh = ZodUnion<[ZodString, ZodNumber, ZodBigInt]>
type BigIntIsh = string | number | bigint

export type ZodUint<T extends keyof uint> = ZodEffects<
	ZodEffects<ZodBigIntIsh, bigint, BigIntIsh>,
	uint[T],
	BigIntIsh
>
export type ZodInt<T extends keyof int> = ZodEffects<
	ZodEffects<ZodBigIntIsh, bigint, BigIntIsh>,
	int[T],
	BigIntIsh
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

export type LimitOrderRaw = { signature: HexString; order: Order }
export type LimitOrder = LimitOrderRaw & { id: string; timestamp?: bigint }
