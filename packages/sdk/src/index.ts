import KwentaSDK from '@kwenta/sdk'
import { SnxV3NetworkIds, SupportedNetworkIds } from '@kwenta/sdk/types'
import { hc } from 'hono/client'
import type { AppRouter } from 'orderbook-backend/routes'
import { solidity } from 'orderbook-backend/schemas'
import { domain, orderTypes } from 'orderbook-backend/signing'
import { type Order, OrderType } from 'orderbook-backend/types'
import {
	http,
	type HttpTransport,
	type PublicClient,
	createPublicClient,
	hashTypedData,
	stringToHex,
	zeroAddress,
} from 'viem'
import { base } from 'viem/chains'
import type { SDKAccount } from './types'

export class OrderbookSDK {
	private readonly client: ReturnType<typeof hc<AppRouter>>
	private readonly publicClient: PublicClient<HttpTransport, typeof base>
	private readonly account?: SDKAccount

	private kwentaSdk: KwentaSDK

	private accountId?: bigint
	constructor(apiUrl: string, rpcUrl?: string, account?: SDKAccount) {
		this.client = hc<AppRouter>(apiUrl)
		this.publicClient = createPublicClient({
			transport: http(rpcUrl),
			chain: base,
		})
		this.account = account

		this.kwentaSdk = new KwentaSDK({
			apiUrl: 'https://api.kwenta.io',
			supportedChains: {
				[SupportedNetworkIds.BASE_MAINNET]: rpcUrl ? [rpcUrl] : [],
				[SupportedNetworkIds.ARB_MAINNET]: ['https://arbitrum.llamarpc.com'],
			},
			logError: console.error,
			walletAddress: account?.address,
		})

		if (account) {
			this.getAccountId()
		}
	}

	private async getAccountId() {
		if (!this.account) {
			return
		}

		if (this.accountId) {
			return this.accountId
		}

		const accountIds = await this.kwentaSdk.snxPerpsV3.getAccounts(
			this.account.address,
			true,
			SnxV3NetworkIds.BASE_MAINNET
		)

		if (accountIds.length === 0) {
			throw new Error('Account not found')
		}

		this.accountId = accountIds?.[0]?.accountId

		return this.accountId
	}

	async getMarkets(): Promise<{ id: bigint; symbol: string }[]> {
		const response = await this.client.markets.$get({ query: {} })

		if (response.status !== 200) {
			throw new Error('Failed to get markets')
		}

		const res = await response.json()

		return res.map((market) => ({
			id: solidity.uint128().parse(market.id),
			symbol: market.symbol,
		}))
	}

	async getMarket(id: bigint): Promise<{ id: bigint; symbol: string }> {
		const response = await this.client.markets.$get({ query: { marketId: id.toString() } })

		if (response.status !== 200) {
			throw new Error('Failed to get market')
		}

		const res = await response.json()

		const market = res[0]

		if (!market) {
			throw new Error('Market not found')
		}

		return {
			id: solidity.uint128().parse(market.id),
			symbol: market.symbol,
		}
	}

	async getOrders(marketId: bigint): Promise<{ id: string; order: Order }[]> {
		const response = await this.client.orders[':marketId'].$get({
			param: { marketId: marketId.toString() },
		})

		if (response.status !== 200) {
			throw new Error('Failed to get orders')
		}

		const res = await response.json()

		return res.map(({ id, order }) => ({
			id,
			order: {
				metadata: {
					...order.metadata,
					genesis: solidity.uint256().parse(order.metadata.genesis),
					expiration: solidity.uint256().parse(order.metadata.expiration),
				},
				trader: {
					...order.trader,
					nonce: solidity.uint256().parse(order.trader.nonce),
					accountId: solidity.uint128().parse(order.trader.accountId),
				},
				trade: {
					...order.trade,
					marketId: solidity.uint128().parse(order.trade.marketId),
					size: solidity.int128().parse(order.trade.size),
					price: solidity.uint256().parse(order.trade.price),
				},
				conditions: order.conditions,
			},
		}))
	}

	async getOrder(marketId: bigint, orderId: string): Promise<{ id: string; order: Order }> {
		const response = await this.client.orders[':marketId'][':orderId'].$get({
			param: { marketId: marketId.toString(), orderId },
		})

		if (response.status !== 200) {
			throw new Error('Failed to get order')
		}

		const { id, order } = await response.json()

		return {
			id,
			order: {
				metadata: {
					...order.metadata,
					genesis: solidity.uint256().parse(order.metadata.genesis),
					expiration: solidity.uint256().parse(order.metadata.expiration),
				},
				trader: {
					...order.trader,
					nonce: solidity.uint256().parse(order.trader.nonce),
					accountId: solidity.uint128().parse(order.trader.accountId),
				},
				trade: {
					...order.trade,
					marketId: solidity.uint128().parse(order.trade.marketId),
					size: solidity.int128().parse(order.trade.size),
					price: solidity.uint256().parse(order.trade.price),
				},
				conditions: order.conditions,
			},
		}
	}

	private async getOrderParameters() {
		const accountId = await this.getAccountId()
		if (!accountId) {
			throw new Error('Account ID not found')
		}

		const nonce = await this.getNonce()
		const now = Math.floor(Date.now() / 1000)
		const oneMonthAfter = now + 30 * 24 * 60 * 60

		return {
			accountId,
			nonce,
			now,
			oneMonthAfter,
		}
	}

	private prepareOrder(
		params: Awaited<ReturnType<typeof this.getOrderParameters>>,
		marketId: bigint,
		t: (typeof OrderType)[keyof typeof OrderType],
		size: bigint,
		price: bigint
	) {
		return {
			conditions: [],
			metadata: {
				genesis: BigInt(params.now),
				expiration: BigInt(params.oneMonthAfter),
				trackingCode: stringToHex('KWENTA', { size: 32 }),
				referrer: zeroAddress,
			},
			trade: {
				t,
				marketId,
				size,
				price,
			},
			trader: {
				nonce: params.nonce,
				accountId: params.accountId,
				signer: this.account!.address,
			},
		} as const
	}

	private async signOrder(order: ReturnType<typeof this.prepareOrder>) {
		const params = {
			domain,
			message: order,
			primaryType: 'Order' as const,
			types: orderTypes,
		} as const

		const _isValidOrder = hashTypedData(params)

		return await this.account!.signTypedData({
			...params,
			account: this.account!.address,
		})
	}

	private formatOrderForRequest(order: ReturnType<typeof this.prepareOrder>) {
		return {
			conditions: [...order.conditions],
			metadata: {
				...order.metadata,
				genesis: order.metadata.genesis.toString(),
				expiration: order.metadata.expiration.toString(),
			},
			trade: {
				...order.trade,
				marketId: order.trade.marketId.toString(),
				size: order.trade.size.toString(),
				price: order.trade.price.toString(),
			},
			trader: {
				...order.trader,
				accountId: order.trader.accountId.toString(),
				nonce: order.trader.nonce.toString(),
			},
		}
	}

	async createOrder(
		marketId: bigint,
		t: (typeof OrderType)[keyof typeof OrderType],
		size: bigint,
		price: bigint
	) {
		if (!this.account) {
			throw new Error('Account is required for creating orders')
		}

		const params = await this.getOrderParameters()
		const order = this.prepareOrder(params, marketId, t, size, price)
		const signature = await this.signOrder(order)
		const formattedOrder = this.formatOrderForRequest(order)

		const response = await this.client.orders[':marketId'].$post({
			param: { marketId: marketId.toString() },
			json: {
				order: formattedOrder,
				signature,
			},
		})

		return response.json()
	}

	async editOrder(
		marketId: bigint,
		orderId: string,
		newOrder: {
			orderType: (typeof OrderType)[keyof typeof OrderType]
			size: bigint
			price: bigint
		}
	) {
		if (!this.account) {
			throw new Error('Account is required for updating orders')
		}

		const params = await this.getOrderParameters()
		const order = this.prepareOrder(
			params,
			marketId,
			newOrder.orderType,
			newOrder.size,
			newOrder.price
		)
		const signature = await this.signOrder(order)
		const formattedOrder = this.formatOrderForRequest(order)

		const response = await this.client.orders[':marketId'][':orderId'].$patch({
			param: { marketId: marketId.toString(), orderId },
			json: {
				id: orderId,
				order: formattedOrder,
				signature,
				user: this.account.address,
			},
		})

		return response.json()
	}

	async deleteOrder(marketId: bigint, orderId: string) {
		if (!this.account) {
			throw new Error('Account is required for deleting orders')
		}

		const { order: existingOrder } = await this.getOrder(marketId, orderId)
		const params = await this.getOrderParameters()
		const order = this.prepareOrder(
			params,
			marketId,
			existingOrder.trade.t as (typeof OrderType)[keyof typeof OrderType],
			BigInt(0),
			BigInt(String(existingOrder.trade.price))
		)
		const signature = await this.signOrder(order)

		const response = await this.client.orders[':marketId'][':orderId'].$delete({
			param: { marketId: marketId.toString(), orderId },
			json: {
				signature,
			},
		})

		return response.json()
	}

	private async getNonce() {
		if (!this.account) {
			throw new Error('Account is required for getting nonce')
		}

		const accountId = await this.getAccountId()

		if (!accountId) {
			throw new Error('Account ID not found')
		}

		const response = await this.client.user.nonce.$get({
			query: { user: accountId.toString() },
		})

		const { nonce } = await response.json()

		return BigInt(String(nonce))
	}
}

export { OrderType }
