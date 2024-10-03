import { config } from 'dotenv'
import { solidity } from 'schemas'
import { http, createPublicClient } from 'viem'
import { base } from 'viem/chains'
import type { Market } from './types'

config()

const baseClient = createPublicClient({
	chain: base,
	transport: http(`https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_PROJECT_ID}`),
})

const marketProxy = '0x0A2AF931eFFd34b81ebcc57E3d3c9B1E1dE1C9Ce' as const
const abi = [
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

const getSymbols = async (ids: string[]) => {
	const metadataMulti = await baseClient.multicall({
		contracts: ids.map(
			(id) =>
				({
					address: marketProxy,
					abi,
					functionName: 'metadata',
					args: [id],
				}) as const
		),
		allowFailure: false,
	})

	return metadataMulti.map((m) => m[1])
}

export const loadMarkets = async (): Promise<Market[]> => {
	const markets = await baseClient.readContract({
		address: marketProxy,
		abi,
		functionName: 'getMarkets',
	})
	const perpsV3Markets = markets.filter((m) => m !== BigInt(6300)).map((m) => m.toString())
	const symbols = await getSymbols(perpsV3Markets)

	return perpsV3Markets
		.map((id, i) => ({ id: solidity.uint128().parse(id), symbol: symbols[i] ?? '' }))
		.sort((a, b) => Number(a.id - b.id))
}
