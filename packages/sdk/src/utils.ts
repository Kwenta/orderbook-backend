import { TRACKING_CODE } from 'orderbook-backend/constants'
import { type Address, type Chain, type Hex, stringToHex, zeroAddress } from 'viem'
import { base } from 'viem/chains'

export const getTrackingCode = (): Hex => stringToHex(TRACKING_CODE, { size: 32 })

export const getDefaultReferrer = (): Address => zeroAddress

export const getDefaultChain = (): Chain => base
