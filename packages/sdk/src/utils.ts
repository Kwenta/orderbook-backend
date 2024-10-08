import { type Address, type Chain, type Hex, stringToHex, zeroAddress } from 'viem'
import { base } from 'viem/chains'
import { TRACKING_CODE } from './constants'

// TODO (refactor): Get from backend package
export const domain = (chainId: bigint | number, contractAddress: Hex) =>
	({
		chainId: Number(chainId),
		verifyingContract: contractAddress,
		name: 'SyntheticPerpetualFutures',
		version: '1',
	}) as const

export const getTrackingCode = (): Hex => stringToHex(TRACKING_CODE, { size: 32 })

export const getDefaultReferrer = (): Address => zeroAddress

export const getDefaultChain = (): Chain => base
