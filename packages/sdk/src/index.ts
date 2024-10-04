import KwentaSDK from '@kwenta/sdk'
import { SnxV3NetworkIds, SupportedNetworkIds } from '@kwenta/sdk/types'
import type { AppRouter } from '@orderbook/routes'
import type { Market } from '@orderbook/types'
import { hc } from 'hono/client'
import {
	http,
	type Address,
	type Hex,
	type HttpTransport,
	type PublicClient,
	type SignableMessage,
	createPublicClient,
	hashTypedData,
	stringToHex,
	zeroAddress,
} from 'viem'
import { base } from 'viem/chains'

// TODO: Remove from here
export const OrderType = {
	// conditional execution:
	//  - buy   @ QUOTE != 0
	//  - sell  @ QUOTE != 0
	//
	// side effects:
	//  - LOB depth consumed if available; order "killed" otherwise
	MARKET: 1,
	// conditional execution:
	//  - buy   @ QUOTE <= LIMIT price
	//  - sell  @ QUOTE >= LIMIT price
	//
	// side effects:
	//  - LOB depth increases when condition not satisfied
	//  - LOB depth decreases when condition satisfied
	LIMIT: 2,
	// conditional execution:
	//  - buy   @ QUOTE >= STOP price
	//  - sell  @ QUOTE <= STOP price
	//
	// side effects:
	// - LOB depth unchanged until condition satisfied
	// - LOB depth decreases when condition satisfied
	STOP: 3,
	// conditional execution:
	//  - buy   @ QUOTE >= STOP price && QUOTE <= LIMIT price
	//  - sell  @ QUOTE <= STOP price && QUOTE >= LIMIT price
	//
	// side effects:
	// - LOB depth unchanged when STOP condition is not satisfied
	// - LOB depth increases when STOP condition satisfied but not LIMIT
	// - LOB depth decreases when both conditions satisfied
	STOP_LIMIT: 4,
} as const

export const orderTypes = {
	Order: [
		{ name: 'metadata', type: 'Metadata' },
		{ name: 'trader', type: 'Trader' },
		{ name: 'trade', type: 'Trade' },
		{ name: 'conditions', type: 'Condition[]' },
	],
	Metadata: [
		{ name: 'genesis', type: 'uint256' },
		{ name: 'expiration', type: 'uint256' },
		{ name: 'trackingCode', type: 'bytes32' },
		{ name: 'referrer', type: 'address' },
	],
	Trader: [
		{ name: 'nonce', type: 'uint256' },
		{ name: 'accountId', type: 'uint128' },
		{ name: 'signer', type: 'address' },
	],
	Trade: [
		{ name: 't', type: 'uint8' },
		{ name: 'marketId', type: 'uint128' },
		{ name: 'size', type: 'int128' },
		{ name: 'price', type: 'uint256' },
	],
	Condition: [
		{ name: 'target', type: 'address' },
		{ name: 'selector', type: 'bytes4' },
		{ name: 'data', type: 'bytes' },
		{ name: 'expected', type: 'bytes32' },
	],
} as const

export const domain = (chainId: bigint | number, contractAddress: Hex) =>
	({
		chainId: Number(chainId),
		verifyingContract: contractAddress,
		name: 'SyntheticPerpetualFutures',
		version: '1',
	}) as const

type GenericSignMessageParameters = {
	message: SignableMessage
	account?: Address
}

type GenericSignTypedDataParameters = {
	domain: Record<string, any>
	types: Record<string, ReadonlyArray<{ readonly name: string; readonly type: string }>>
	primaryType: string
	message: Record<string, any>
	account?: Address
}

type SDKAccount = {
	address: Address
	signMessage: (args: GenericSignMessageParameters) => Promise<`0x${string}`>
	signTypedData: (args: GenericSignTypedDataParameters) => Promise<`0x${string}`>
}

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

	async getMarkets() {
		const response = await this.client.markets.$get({ query: {} })

		return (await response.json()) as unknown as Promise<Market[]>
	}

	async getMarket(id: bigint) {
		const response = await this.client.markets.$get({ query: { marketId: id.toString() } })
		return response.json() as Promise<Market>
	}

	async getOrders(marketId: bigint) {
		const response = await this.client.orders[':marketId'].$get({
			param: { marketId: marketId.toString() },
		})
		return response.json()
	}

	async getOrder(marketId: bigint, orderId: string) {
		const response = await this.client.orders[':marketId'][':orderId'].$get({
			param: { marketId: marketId.toString(), orderId },
		})
		return response.json()
	}

	private async getOrderParameters() {
		const accountId = await this.getAccountId()
		if (!accountId) {
			throw new Error('Account ID not found')
		}

		const nonce = await this.getNonce()
		const now = Date.now()
		const oneMonthAfter = now + 30 * 24 * 60 * 60 * 1000

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
				expiration: BigInt(params.oneMonthAfter),
				genesis: BigInt(params.now),
				referrer: zeroAddress,
				trackingCode: stringToHex('KWENTA', { size: 32 }),
			},
			trader: {
				accountId: params.accountId,
				nonce: params.nonce,
				signer: this.account!.address,
			},
			trade: {
				marketId,
				t,
				price,
				size,
			},
		} as const
	}

	private async signOrder(order: ReturnType<typeof this.prepareOrder>) {
		const params = {
			domain: domain(base.id, zeroAddress),
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
				user: this.account.address,
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
