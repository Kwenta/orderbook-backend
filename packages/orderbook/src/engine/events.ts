import { EventEmitter } from 'node:events'
import { INTERVALS } from '../constants'
import { loadMarkets } from '../markets'
import type { MarketId } from '../types'

export const emitters = new Map<MarketId, EventEmitter>()

/**
 * Ensure that all markets have an emitter that is listening for liquidations, price changes, and other relevant events.
 */
export const initEmitters = async () => {
	const markets = await loadMarkets()
	for (const market of markets) {
		if (!emitters.has(market.id)) {
			emitters.set(market.id, new EventEmitter())
		}
	}

	/**
	 * Remove emitters for markets that no longer exist
	 */
	for (const [marketId, emitter] of emitters) {
		if (!markets.find((m) => m.id === marketId)) {
			emitter.removeAllListeners()
			emitters.delete(marketId)
		}
	}

	/**
	 * Ensure markets are rechecked every PERIOD
	 */
	setTimeout(initEmitters, INTERVALS.RECHECK_EMITTERS)
}
