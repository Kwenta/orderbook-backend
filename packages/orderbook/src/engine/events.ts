import { loadMarkets } from '../markets'
import type { MarketId } from '../types'
import EventEmitter = require('node:events')

export const emitters = new Map<MarketId, EventEmitter>()

const addMissingEmitters = async () => {
	const markets = await loadMarkets()
	for (const market of markets) {
		if (!emitters.has(market.id)) {
			emitters.set(market.id, new EventEmitter())
		}
	}
}

export const initEmitters = async () => {
	await addMissingEmitters()
	setTimeout(addMissingEmitters, 30 * 1000)
}
