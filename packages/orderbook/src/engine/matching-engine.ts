import { randomBytes } from 'node:crypto'
import type { EventEmitter } from 'node:events'
import type { Worker } from 'node:worker_threads'
import { HTTPException } from 'hono/http-exception'
import { INTERVALS } from '../constants'
import { ansiColorWrap, logger } from '../logger'
import { loadMarkets } from '../markets'
import { addPerfToInstance, addPerfToStatics, formatTime } from '../monitoring'
import { checkDeleteSignature, checkOrderSignature } from '../signing'
import {
	type AccountId,
	type HexString,
	type LimitOrder,
	type LimitOrderRaw,
	OrderType,
} from '../types'
import type { Market, MarketId } from '../types'
import { marketSide } from '../utils'
import { emitters } from './events'
import { Nonce } from './nonce'

type Book = {
	orders: LimitOrder[]
}

export class MatchingEngine {
	private onChainClosed = false
	private buyOrders: Map<bigint, Map<string, LimitOrder>>
	private sellOrders: Map<bigint, Map<string, LimitOrder>>
	private orderIdToPrice: Map<string, bigint>

	private eventEmitter: EventEmitter

	/**
	 * If the book has been checked for settles since the last change
	 * Set to false whenever an order is updated, added or deleted
	 * Set to true after a checkForPossibleSettles call
	 */
	private bookClean = false

	/**
	 * If the book is in sync with the db
	 * Set to false whenever an order is added, updated or deleted
	 * Set to true after a persistBook call
	 */
	private bookInSync = false

	constructor(public readonly market: Market) {
		this.buyOrders = new Map()
		this.sellOrders = new Map()
		this.orderIdToPrice = new Map()
		this.eventEmitter = emitters.get(market.id)!

		if (!this.eventEmitter) {
			throw new Error(`Event emitter not found for market ${market.id}`)
		}

		this.eventEmitter.on('liquidation', (user: AccountId) => {
			this.removeUserOrders(user)
		})

		addPerfToInstance('MatchingEngine', this)
	}

	async initBookFromDB() {
		MatchingEngine.worker?.postMessage(
			JSON.stringify({ type: 'load_book', data: { marketId: this.market.id } })
		)
		const book = await new Promise<Book>((resolve) => {
			const resolveWhenBook = (message: string) => {
				const data = JSON.parse(message)

				if (data.type === 'book_init') {
					MatchingEngine.worker?.off('message', resolveWhenBook)
					resolve(data.book)
				}
			}
			MatchingEngine.worker?.on('message', resolveWhenBook)
		})

		logger.debug(`Loaded book ${this.market.id}, ${book.orders.length} orders`)

		for (const order of book.orders) this.addOrderUnsafe(order)
	}

	persistBook() {
		if (this.bookInSync) return false
		// TODO: Ensure ordering of orders array
		const orders = [...this.getOrders('all')]
		MatchingEngine.worker?.postMessage(
			JSON.stringify({ type: 'book', data: { marketId: this.market.id, orders } })
		)
		this.bookInSync = true
		return true
	}

	close() {
		this.persistBook()
		this.onChainClosed = true
	}

	removeUserOrders(user: AccountId) {
		for (const [price, priceMap] of this.buyOrders) {
			for (const [orderId, { order }] of priceMap) {
				if (order.trader.accountId === user) {
					this.orderIdToPrice.delete(orderId)
					priceMap.delete(orderId)
					if (priceMap.size === 0) this.buyOrders.delete(price)
				}
			}
		}

		for (const [price, priceMap] of this.sellOrders) {
			for (const [orderId, { order }] of priceMap) {
				if (order.trader.accountId === user) {
					this.orderIdToPrice.delete(orderId)
					priceMap.delete(orderId)
					if (priceMap.size === 0) this.sellOrders.delete(price)
				}
			}
		}

		this.bookClean = false
		this.bookInSync = false
		this.checkForPossibleSettles()
	}

	// TODO: Check accountId is valid
	// TODO: Check signer is owner OR delegate
	// TODO: Check account has margin
	// TODO: Check nonce on chain before settle
	// TODO: Extract all checks to helper
	async checkOrderIsValid(orderData: LimitOrder) {
		try {
			await this.checkOrderIsValidOrFail(orderData)
			return true
		} catch (e) {
			return false
		}
	}

	async checkOrderIsValidOrFail(orderData: LimitOrder) {
		const { order } = orderData
		const currentTimestamp = BigInt(Math.floor(Date.now() / 1000))

		if (order.metadata.expiration <= currentTimestamp) {
			throw new Error('Order has expired')
		}

		if (order.trader.nonce !== Nonce.get(order.trader.accountId).nonce) {
			throw new Error('Invalid nonce')
		}

		if (!(await checkOrderSignature(orderData))) {
			throw new Error('Invalid order signature')
		}

		return true
	}

	async addOrder(orderData: LimitOrderRaw) {
		if (this.onChainClosed) throw new Error('Market is closed')
		const currentTimestamp = BigInt(Math.floor(Date.now() / 1000))

		const id = randomBytes(16).toString('hex')

		const orderWithId: LimitOrder = {
			...orderData,
			id,
			timestamp: currentTimestamp,
		}
		await this.checkOrderIsValidOrFail(orderWithId)

		switch (orderWithId.order.trade.t) {
			case OrderType.LIMIT:
			case OrderType.STOP:
			case OrderType.STOP_LIMIT:
				this.addOrderUnsafe(orderWithId)
				break
			case OrderType.MARKET: {
				// Attempt to settle immediately, do not persist
				this.addOrderUnsafe(orderWithId)
				const onBook = this.getOrder(id)

				if (onBook) {
					this.deleteOrder(id, orderData.signature)
				}
				break
			}
			default:
				throw new Error('Invalid order type')
		}

		Nonce.get(orderData.order.trader.accountId).increment()

		await this.checkForPossibleSettles()
		return id
	}

	private addOrderUnsafe(orderData: LimitOrder) {
		const { order, id } = orderData
		const price = order.trade.price

		const orderMap = marketSide(order) === 'buy' ? this.buyOrders : this.sellOrders
		if (!orderMap.has(price)) {
			orderMap.set(price, new Map())
		}

		orderMap.get(price)?.set(id, orderData)
		this.orderIdToPrice.set(id, price)

		this.bookClean = false
		this.bookInSync = false
		MatchingEngine.allBooksInSync = false

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

	async deleteOrder(orderId: string, signature: HexString) {
		const order = this.getOrder(orderId)
		if (!order) {
			throw new Error('Order not found')
		}

		await checkDeleteSignature({ ...order, signature })

		const price = this.orderIdToPrice.get(orderId)
		if (!price) throw new Error('Price not found')
		const orderMap = marketSide(order.order) === 'buy' ? this.buyOrders : this.sellOrders
		orderMap.get(price)?.delete(orderId)
		if (orderMap.get(price)?.size === 0) {
			orderMap.delete(price)
		}
		this.orderIdToPrice.delete(orderId)

		this.bookClean = false
		this.bookInSync = false
		MatchingEngine.allBooksInSync = false
	}

	async pruneBook() {
		for (const [_price, buyOrdersMap] of this.buyOrders) {
			for (const [orderId, { order, signature }] of buyOrdersMap) {
				if (!(await this.checkOrderIsValid({ order, signature, id: orderId }))) {
					this.deleteOrder(orderId, signature)
				}
			}
		}

		for (const [_price, sellOrdersMap] of this.sellOrders) {
			for (const [orderId, { order, signature }] of sellOrdersMap) {
				if (!(await this.checkOrderIsValid({ order, signature, id: orderId }))) {
					this.deleteOrder(orderId, signature)
				}
			}
		}

		this.bookClean = true
		this.bookInSync = false
	}

	async settle(buyOrder: LimitOrder, sellOrder: LimitOrder) {}

	async checkForPossibleSettles() {
		if (this.bookClean) return

		const matchingOrders: { buy: LimitOrder[]; sell: LimitOrder[] }[] = []

		for (const [price, buyOrdersMap] of this.buyOrders) {
			const sellOrdersMap = this.sellOrders.get(price)

			if (sellOrdersMap) {
				const matches = { buy: [...buyOrdersMap.values()], sell: [...sellOrdersMap.values()] }
				matchingOrders.push(matches)
			}
		}

		for (const matches of matchingOrders) {
			const { buy, sell } = matches
			buy.sort((a, b) => Number(a.order.metadata.genesis! - b.order.metadata.genesis!))
			sell.sort((a, b) => Number(a.order.metadata.genesis! - b.order.metadata.genesis!))

			const totalToSettle = Math.min(buy.length, sell.length)

			for (let i = 0; i < totalToSettle; i++) {
				const buyOrder = buy[i]
				const sellOrder = sell[i]
				await this.settle(buyOrder!, sellOrder!)
			}
		}

		// TODO: Decide how we order the matching

		// Pair up orders, then recheck for settles

		this.pruneBook()

		return matchingOrders
	}

	private static engines = new Map<MarketId, MatchingEngine>()

	private static worker?: Worker

	private static allBooksInSync = false

	static findOrFail(marketId?: MarketId) {
		if (!marketId) throw new HTTPException(400, { message: 'The market was not provided' })

		const engine = MatchingEngine.engines.get(marketId)
		if (!engine) throw new HTTPException(404, { message: 'The market was not found' })

		return engine
	}

	static async persistAll() {
		if (!MatchingEngine.allBooksInSync) {
			const start = process.hrtime.bigint()
			const results = [...MatchingEngine.engines.entries()].map(([marketId, engine]) => ({
				marketId,
				changed: engine.persistBook(),
			}))

			const changed = results.filter((r) => r.changed).map((r) => r.marketId)
			const unchanged = results.filter((r) => !r.changed).map((r) => r.marketId)

			const end = process.hrtime.bigint()

			const time = end - start

			logger.info(
				`Persisted ${ansiColorWrap(changed.length, 'green')}:${ansiColorWrap(unchanged.length, 'red')} market changes, took ${formatTime(time)}`
			)

			MatchingEngine.allBooksInSync = true
		}
		setTimeout(MatchingEngine.persistAll, INTERVALS.PERSIST_ALL_BOOKS)
	}

	static async addMissing() {
		const markets = await loadMarkets()

		const marketsThatGotCreated = []
		for (const market of markets) {
			if (!MatchingEngine.engines.has(market.id)) {
				const engine = new MatchingEngine(market)
				await engine.initBookFromDB()
				MatchingEngine.engines.set(market.id, engine)
				marketsThatGotCreated.push(market)
			}
		}

		logger.debug(`Creating engines for market ${marketsThatGotCreated.map((m) => m.id)}`)
		for (const [marketId, engine] of MatchingEngine.engines) {
			if (!markets.find((m) => m.id === marketId)) {
				engine.close()
			}
		}

		setTimeout(MatchingEngine.addMissing, INTERVALS.RECHECK_ENGINES)
	}

	static async checkAllForPossibleSettles() {
		for (const engine of MatchingEngine.engines.values()) {
			engine.checkForPossibleSettles()
		}

		setTimeout(MatchingEngine.checkAllForPossibleSettles, INTERVALS.RECHECK_SETTLES)
	}

	static async init(worker: Worker) {
		MatchingEngine.worker = worker
		await MatchingEngine.addMissing()
		await MatchingEngine.persistAll()
		await MatchingEngine.checkAllForPossibleSettles()

		addPerfToStatics('MatchingEngine', MatchingEngine)
	}
}
