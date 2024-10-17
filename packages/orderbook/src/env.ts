import { config } from 'dotenv'
import { type Address, type Hex, zeroAddress } from 'viem'
import { logger } from './logger'
import type { SupportedChains } from './types'

// TODO: Replace this with a zod env schema
config()

export const privateKey = process.env.PRIVATE_KEY as Hex

if (!privateKey) logger.info('PRIVATE_KEY is not set')

export const rpcUrl = process.env.RPC_URL!
if (!rpcUrl) logger.info('RPC_URL is not set')

export const chainId = Number.parseInt(process.env.CHAIN_ID ?? '8453') as SupportedChains
export const verifyingContract = (process.env.CONTRACT_ADDRESS ?? zeroAddress) as Address
export const domainVersion = process.env.domainVersion ?? '1'
export const domainName = process.env.domainName ?? 'Mock Clearinghouse'

export const pythUrl = process.env.PYTH_URL ?? 'https://hermes.pyth.network/'
