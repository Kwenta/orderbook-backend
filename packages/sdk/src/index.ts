import KwentaSDK from '@kwenta/sdk'
import { SnxV3NetworkIds, SupportedNetworkIds } from '@kwenta/sdk/types'
import type { AppRouter } from '@orderbook/routes'
import { bytes32 } from '@orderbook/schemas/solidity'
import { type Market, type Order, OrderType } from '@orderbook/types'
import { hc } from 'hono/client'
import {
	http,
	type Address,
	type HttpTransport,
	type PublicClient,
	type SignableMessage,
	createPublicClient,
	stringToHex,
	zeroAddress,
} from 'viem'
import { base } from 'viem/chains'

type GenericSignMessageParameters = {
	message: SignableMessage
	account?: Address
}

type GenericSignTypedDataParameters = {
	domain: Record<string, any>
	types: Record<string, Array<{ name: string; type: string }>>
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

	async createOrder(marketId: bigint, orderType: typeof OrderType, size: bigint, price: bigint) {
		if (!this.account) {
			throw new Error('Account is required for creating orders')
		}

		const accountId = await this.getAccountId()

		if (!accountId) {
			throw new Error('Account ID not found')
		}

		const nonce = await this.getNonce()

		const now = Date.now()
		const oneMonthAfter = now + 30 * 24 * 60 * 60 * 1000

		const order = {
			conditions: [],
			metadata: {
				expiration: BigInt(oneMonthAfter),
				genesis: BigInt(now),
				referrer: zeroAddress,
				trackingCode: stringToHex('KWENTA', { size: 32 }),
			},
			trader: {
				accountId,
				nonce,
				signer: this.account.address,
			},
			trade: {
				marketId,
				orderType: orderType,
				price,
				size,
			},
		}

		const signature = await this.account.signTypedData({})

		// const signature = await this.signOrder(order)
		// const response = await this.client.orders[':marketId'].$post({
		// 	param: { marketId },
		// 	json: {
		// 		order,
		// 		signature,
		// 		user: this.account.address,
		// 	},
		// })
		// return response.json()
	}

	private async getNonce() {
		if (!this.account) {
			throw new Error('Account is required for getting nonce')
		}

		const response = await this.client.user.nonce.$get({
			query: { user: this.account.address },
		})

		const { nonce } = await response.json()

		return nonce as unknown as bigint
	}

	// async updateOrder(
	// 	marketId: z.infer<typeof marketId>,
	// 	orderId: string,
	// 	order: z.infer<typeof orderSchema>
	// ) {
	// 	if (!this.account) {
	// 		throw new Error('Account is required for updating orders')
	// 	}
	// 	const signature = await this.signOrder(order)
	// 	const response = await this.client.orders[':marketId'][':orderId'].$patch({
	// 		param: { marketId, orderId },
	// 		json: { ...order, signature },
	// 	})
	// 	return response.json()
	// }

	// async deleteOrder(marketId: z.infer<typeof marketId>, orderId: string) {
	// 	if (!this.account) {
	// 		throw new Error('Account is required for deleting orders')
	// 	}
	// 	const signature = await this.signDeleteOrder(marketId, orderId)
	// 	const response = await this.client.orders[':marketId'][':orderId'].$delete({
	// 		param: { marketId, orderId },
	// 		json: { signature },
	// 	})
	// 	return response.json()
	// }

	// async getOrderBook(marketId: bigint) {
	// 	const response = await this.client.book.$get({
	// 		query: { marketId: marketId.toString(), offset: '0', limit: '100' },
	// 	})
	// 	return response.json()
	// }

	// Helper methods for signing
	// private async signOrder(_order: z.infer<typeof orderSchema>): Promise<HexString> {
	// 	if (!this.account) {
	// 		throw new Error('Account is required for signing orders')
	// 	}
	// 	// Implementation of order signing using signTypedData with viem
	// 	// Here we need to use the order structure from the schema to create typed data
	// 	throw new Error('Not implemented')
	// }

	// private async signDeleteOrder(_marketId: bigint, _orderId: string): Promise<HexString> {
	// 	if (!this.account) {
	// 		throw new Error('Account is required for signing delete order requests')
	// 	}

	// 	throw new Error('Not implemented')
	// }
}
