import type { Address } from 'viem'

export type GenericSignTypedDataParameters = {
	domain: Record<string, any>
	types: Record<string, ReadonlyArray<{ readonly name: string; readonly type: string }>>
	primaryType: string
	message: Record<string, any>
	account?: Address
}

export type SDKAccount = {
	address: Address
	signTypedData: (args: GenericSignTypedDataParameters) => Promise<`0x${string}`>
}
