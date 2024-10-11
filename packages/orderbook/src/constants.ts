import { stringToHex } from 'viem'

export const TRACKING_CODE = stringToHex('KWENTA', { size: 32 })

export const INTERVALS = {
	RECHECK_EMITTERS: 30_000,
	RECHECK_ENGINES: 30_000,
	RECHECK_SETTLES: 1_000,
	PERSIST_ALL_BOOKS: 1_000,
	PERSIST_NONCES: 30_000,
} as const

export const LOG_COLOURS = {
	black: 30,
	red: 31,
	green: 32,
	yellow: 33,
	blue: 34,
	magenta: 35,
	cyan: 36,
	white: 37,
}

export const LOG_LEVELS = {
	INFO: 'blue',
	DEBUG: 'magenta',
	ERROR: 'red',
	WARN: 'yellow',
} as const

export const marketProxy = {
	8453: '0x0A2AF931eFFd34b81ebcc57E3d3c9B1E1dE1C9Ce',
} as const

export const marketProxyABI = [
	{
		inputs: [],
		name: 'getMarkets',
		outputs: [{ internalType: 'uint256[]', name: 'marketIds', type: 'uint256[]' }],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [{ type: 'uint128' }],
		name: 'metadata',
		outputs: [{ type: 'string' }, { type: 'string' }],
		type: 'function',
		stateMutability: 'view',
	},
] as const

export const ONE_DAY = 24 * 60 * 60 * 1000
