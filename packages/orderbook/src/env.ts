import { type Address, zeroAddress } from 'viem'
import type { SupportedChains } from './types'

// TODO: Replace this with a zod env schema
export const chainId = Number.parseInt(process.env.CHAIN_ID ?? '8453') as SupportedChains
export const verifyingContract = (process.env.CONTRACT_ADDRESS ?? zeroAddress) as Address
