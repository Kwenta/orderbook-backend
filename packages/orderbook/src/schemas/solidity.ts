import { z } from '@hono/zod-openapi'
import { checksumAddress, isAddress } from 'viem'
import * as viem from 'viem'
import type {
	BytesSizes,
	HexString,
	Sizes,
	ZodBytes,
	ZodInt,
	ZodUint,
	bytes,
	int,
	uint,
} from '../types'

export const hexString = (n = 1000, strict = false, description?: string) => {
	const schema = z
		.string()
		.refine((s) => (s.startsWith('0x') && strict ? s.length === n * 2 + 2 : s.length <= n * 2 + 2))
		.transform((s) => s as HexString)

	return description ? schema.describe(description) : schema
}
export const address = (description?: string) => {
	return hexString(20, true, description ?? 'A valid Ethereum address')
		.refine((s) => isAddress(s))
		.transform((s) => checksumAddress(s))
}

const bytesSchema = (n: BytesSizes = 32, description?: string): ZodBytes<keyof bytes> => {
	if (n < 0 || n > 32) throw new Error('Invalid bytes size')

	return hexString(n, true, description) as ZodBytes<keyof bytes>
}

const uintSchema = (n: Sizes = 256, description?: string): ZodUint<keyof uint> => {
	if (n < 0 || n > 256) throw new Error('Invalid uint size')
	const maxValue = viem[`maxUint${n}`]
	const schema = z
		.union([z.string(), z.number(), z.bigint()])
		.transform(BigInt)
		.refine(
			(x) => x >= BigInt(0) && x < maxValue,
			`Value must be between 0 and ${maxValue}`
		) as ZodUint<keyof uint>

	return description ? schema.describe(description) : schema
}

const intSchema = (n: Sizes = 256, description?: string): ZodInt<keyof int> => {
	if (n < 0 || n > 256) throw new Error('Invalid uint size')
	const maxValue = viem[`maxInt${n}`]
	const minValue = viem[`minInt${n}`]
	const schema = z
		.union([z.string(), z.number(), z.bigint()])
		.transform(BigInt)
		.refine(
			(x) => x > minValue && x < maxValue,
			`Value must be between ${minValue} and ${maxValue}`
		) as ZodInt<keyof int>

	return description ? schema.describe(description) : schema
}

export const bytes4 = (description?: string) => bytesSchema(4, description) as ZodBytes<4>
export const bytes32 = (description?: string) => bytesSchema(32, description) as ZodBytes<32>

export const uint8 = (description?: string) => uintSchema(8, description) as ZodUint<8>
export const uint128 = (description?: string) => uintSchema(128, description) as ZodUint<128>
export const uint256 = (description?: string) => uintSchema(256, description) as ZodUint<256>

export const int8 = (description?: string) => intSchema(8, description) as ZodInt<8>
export const int128 = (description?: string) => intSchema(128, description) as ZodInt<128>
export const int256 = (description?: string) => intSchema(256, description) as ZodInt<256>

export const FunctionSelector = (description?: string) => bytes4(description)
export const Signature = (description?: string) => bytes32(description)
