import { http, createPublicClient } from 'viem'
import { base } from 'viem/chains'
import { ONE_DAY, marketProxy, marketProxyABI } from './constants'
import { chainId, rpcUrl } from './env'
import { logger } from './logger'
import { memoAsync } from './memo'
import { perfFuncAsync } from './monitoring'
import { solidity } from './schemas'
import type { Market, SupportedChains } from './types'

// TODO: Make work with any chain
export const baseClient = createPublicClient({
	chain: base,
	transport: http(rpcUrl),
})

const getSymbols = perfFuncAsync('getSymbols')(
	memoAsync(ONE_DAY)(async (chainId: SupportedChains, ids: string[]) => {
		const metadataMulti = await baseClient.multicall({
			contracts: ids.map(
				(id) =>
					({
						address: marketProxy[chainId],
						abi: marketProxyABI,
						functionName: 'metadata',
						args: [id],
					}) as const
			),
			allowFailure: false,
		})

		return metadataMulti.map((m) => m[1])
	})
)

export const loadMarkets = perfFuncAsync('loadMarkets')(
	memoAsync(ONE_DAY)(async (): Promise<Market[]> => {
		const markets = await baseClient.readContract({
			address: marketProxy[chainId],
			abi: marketProxyABI,
			functionName: 'getMarkets',
		})
		const perpsV3Markets = markets.filter((m) => m !== BigInt(6300)).map((m) => m.toString())
		const symbols = await getSymbols(chainId, perpsV3Markets)

		const marketDetails = perpsV3Markets
			.map((id, i) => ({ id: solidity.uint128().parse(id), symbol: symbols[i] ?? '' }))
			.sort((a, b) => Number(a.id - b.id))
		logger.debug(
			`Loaded ${marketDetails.length} markets: ${marketDetails.map((m) => m.symbol).join(', ')}`
		)

		return marketDetails
	})
)
