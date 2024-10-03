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

export const hexString = (n = 1000, strict = false) =>
	z
		.string()
		.refine((s) => (s.startsWith('0x') && strict ? s.length === n * 2 + 2 : s.length <= n * 2 + 2))
		.transform((s) => s as HexString)

export const address = () =>
	hexString()
		.refine((s) => isAddress(s))
		.transform((s) => checksumAddress(s))

const bytesSchema = (n: BytesSizes = 32): ZodBytes<keyof bytes> => {
	if (n < 0 || n > 32) throw new Error('Invalid bytes size')
	return hexString(n, true) as ZodBytes<keyof bytes>
}

const uintSchema = (n: Sizes = 256): ZodUint<keyof uint> => {
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

const intSchema = (n: Sizes = 256): ZodInt<keyof int> => {
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

export const bytes4 = () => bytesSchema(4) as ZodBytes<4>
export const bytes32 = () => bytesSchema(32) as ZodBytes<32>

export const uint8 = () => uintSchema(8) as ZodUint<8>
export const uint128 = () => uintSchema(128) as ZodUint<128>
export const uint256 = () => uintSchema(256) as ZodUint<256>

export const int8 = () => intSchema(8) as ZodInt<8>
export const int128 = () => intSchema(128) as ZodInt<128>
export const int256 = () => intSchema(256) as ZodInt<256>

export const FunctionSelector = bytes4()
export const Signature = bytes32()
