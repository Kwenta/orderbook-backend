import { randomBytes } from 'node:crypto'
import type { EventEmitter } from 'node:events'
import { HTTPException } from 'hono/http-exception'
import { type Address, zeroAddress } from 'viem'
import { loadMarkets } from '../markets'
import { checkSignatureOfOrder } from '../signing'
import type { HexString, Order, int } from '../types'
import type { Market, MarketId } from '../types'
import { emitters } from './events'

type LimitOrder = LimitOrderRaw & { id: string; timestamp?: bigint }

type LimitOrderRaw = { signature: HexString; user: HexString; order: Order }

const side = (order: Order) => (order.trade.size < BigInt(0) ? 'sell' : 'buy')

const checkOrderSignature = async (order: LimitOrder) => {
	return checkSignatureOfOrder(order.order, zeroAddress, BigInt(1), order.user, order.signature)
}

const checkDeleteSignature = async (lo: LimitOrder) => {
	const newOrder = structuredClone(lo)
	newOrder.order.trade.size = BigInt(0) as int[128]
	return await checkOrderSignature(newOrder)
}

export class MatchingEngine {
	private onChainClosed = false
	private buyOrders: Map<bigint, Map<string, LimitOrder>>
	private sellOrders: Map<bigint, Map<string, LimitOrder>>
	private orderIdToPrice: Map<string, bigint>

	private eventEmitter: EventEmitter

	constructor(public readonly market: Market) {
		this.buyOrders = new Map()
		this.sellOrders = new Map()
		this.orderIdToPrice = new Map()
		this.eventEmitter = emitters.get(market.id)!

		if (!this.eventEmitter) {
			throw new Error(`Event emitter not found for market ${market.id}`)
		}

		this.eventEmitter.on('liquidation', (user: Address) => {
			this.removeUserOrders(user)
		})
	}

	close() {
		this.onChainClosed = true
	}

	removeUserOrders(user: Address) {
		for (const [price, priceMap] of this.buyOrders) {
			for (const [orderId, { user: orderUser }] of priceMap) {
				if (orderUser === user) {
					this.orderIdToPrice.delete(orderId)
					priceMap.delete(orderId)
					if (priceMap.size === 0) this.buyOrders.delete(price)
				}
			}
		}

		for (const [price, priceMap] of this.sellOrders) {
			for (const [orderId, { user: orderUser }] of priceMap) {
				if (orderUser === user) {
					this.orderIdToPrice.delete(orderId)
					priceMap.delete(orderId)
					if (priceMap.size === 0) this.sellOrders.delete(price)
				}
			}
		}

		this.checkForPossibleSettles()
	}

	async addOrder(orderData: LimitOrderRaw) {
		if (this.onChainClosed) throw new Error('Market is closed')
		const currentTimestamp = BigInt(Math.floor(Date.now() / 1000))
		if (orderData.order.metadata.expiration <= currentTimestamp) {
			throw new Error('Order has expired')
		}

		const orderWithId: LimitOrder = {
			...orderData,
			id: randomBytes(16).toString('hex'),
			timestamp: currentTimestamp,
		}

		const { order, id } = orderWithId
		const price = order.trade.price

		if (!(await checkOrderSignature(orderWithId))) {
			throw new Error('Invalid order signature')
		}

		const orderMap = side(order) === 'buy' ? this.buyOrders : this.sellOrders
		if (!orderMap.has(price)) {
			orderMap.set(price, new Map())
		}

		orderMap.get(price)?.set(id, orderWithId)
		this.orderIdToPrice.set(id, price)

		await this.checkForPossibleSettles()
		return id
	}

	getOrders(type: 'buy' | 'sell' | 'all' = 'all', price?: bigint): LimitOrder[] {
		const getOrdersFromMap = (map: Map<bigint, Map<string, LimitOrder>>) => {
			if (price !== undefined) {
				return Array.from(map.get(price)?.values() ?? [])
			}
			return Array.from(map.values()).flatMap((priceMap) => Array.from(priceMap.values()))
		}

		switch (type) {
			case 'buy':
				return getOrdersFromMap(this.buyOrders)
			case 'sell':
				return getOrdersFromMap(this.sellOrders)
			case 'all':
				return [...getOrdersFromMap(this.buyOrders), ...getOrdersFromMap(this.sellOrders)]
		}
	}

	getOrdersWithoutSigs(
		type: 'buy' | 'sell' | 'all' = 'all',
		price?: bigint
	): Omit<LimitOrder, 'signature'>[] {
		const orders = this.getOrders(type, price)
		return orders.map(({ signature, ...order }) => order)
	}

	getOrder(orderId: string): LimitOrder | undefined {
		const price = this.orderIdToPrice.get(orderId)
		if (price === undefined) return undefined

		return this.buyOrders.get(price)?.get(orderId) || this.sellOrders.get(price)?.get(orderId)
	}

	getOrderWithoutSig(orderId: string): Omit<LimitOrder, 'signature'> | undefined {
		const order = this.getOrder(orderId)
		if (!order) return undefined

		const { signature, ...orderWithoutSig } = order
		return orderWithoutSig
	}

	async updateOrder(newOrder: LimitOrder & { id: string }) {
		if (this.onChainClosed) throw new Error('Market is closed')
		await checkOrderSignature(newOrder)

		// Just remove from memory, not onchain
		this.deleteOrder(newOrder.id, newOrder.signature)

		this.addOrder(newOrder)
	}

	async deleteOrder(orderId: string, signature: Hex) {
		const order = this.getOrder(orderId)
		if (!order) {
			throw new Error('Order not found')
		}

		await checkDeleteSignature({ ...order, signature })

		const price = this.orderIdToPrice.get(orderId)
		if (!price) throw new Error('Price not found')
		const orderMap = side(order.order) === 'buy' ? this.buyOrders : this.sellOrders
		orderMap.get(price)?.delete(orderId)
		if (orderMap.get(price)?.size === 0) {
			orderMap.delete(price)
		}
		this.orderIdToPrice.delete(orderId)
	}

	pruneBook() {
		const currentTimestamp = BigInt(Math.floor(Date.now() / 1000))
		for (const [_price, buyOrdersMap] of this.buyOrders) {
			for (const [orderId, { order, signature }] of buyOrdersMap) {
				if (order.metadata.expiration <= currentTimestamp) {
					this.deleteOrder(orderId, signature)
				}
			}
		}

		for (const [_price, sellOrdersMap] of this.sellOrders) {
			for (const [orderId, { order, signature }] of sellOrdersMap) {
				if (order.metadata.expiration <= currentTimestamp) {
					this.deleteOrder(orderId, signature)
				}
			}
		}
	}

	checkForPossibleSettles() {
		const matchingOrders: LimitOrder[] = []

		for (const [price, buyOrdersMap] of this.buyOrders) {
			const sellOrdersMap = this.sellOrders.get(price)

			if (sellOrdersMap) {
				matchingOrders.push(...buyOrdersMap.values())
				matchingOrders.push(...sellOrdersMap.values())
			}
		}

		// TODO: Decide how we order the matching

		// Pair up orders, then recheck for settles
		return matchingOrders
	}
}

export const engines = new Map<MarketId, MatchingEngine>()

const addMissingEngines = async () => {
	const markets = await loadMarkets()
	for (const market of markets) {
		if (!engines.has(market.id)) {
			engines.set(market.id, new MatchingEngine(market))
		}
	}

	// Validate all markets are still valid
	for (const [marketId, engine] of engines) {
		if (!markets.find((m) => m.id === marketId)) {
			engine.close()
		}
	}
}

export const init = async () => {
	await addMissingEngines()
	setTimeout(addMissingEngines, 30 * 1000)
}

export const findEngineOrFail = (marketId?: MarketId) => {
	if (!marketId) throw new HTTPException(400, { message: 'The market was not provided' })

	const engine = engines.get(marketId)
	if (!engine) throw new HTTPException(404, { message: 'The market was not found' })

	return engine
}
