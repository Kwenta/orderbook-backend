import type { AppRouter } from '@orderbook/routes'
import { hc } from 'hono/client'
import {
	http,
	type Address,
	type HttpTransport,
	type PublicClient,
	type SignMessageParameters,
	type SignMessageReturnType,
	type SignTypedDataParameters,
	type SignTypedDataReturnType,
	type SignableMessage,
	createPublicClient,
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

	constructor(apiUrl: string, rpcUrl?: string, account?: SDKAccount) {
		this.client = hc<AppRouter>(apiUrl)
		this.publicClient = createPublicClient({
			transport: http(rpcUrl),
			chain: base,
		})
		this.account = account
	}

	async getMarkets() {
		const response = await this.client.markets.$get({ query: {} })

		return await response.json()
	}

	async getMarket(id: bigint) {
		const response = await this.client.markets.$get({ query: { marketId: id.toString() } })
		return response.json()
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

	// async createOrder(marketId: bigint, order: z.infer<typeof orderSchema>) {
	// 	if (!this.account) {
	// 		throw new Error('Account is required for creating orders')
	// 	}
	// 	const signature = await this.signOrder(order)
	// 	const response = await this.client.orders[':marketId'].$post({
	// 		param: { marketId },
	// 		json: {
	// 			order,
	// 			signature,
	// 			user: this.account.address,
	// 		},
	// 	})
	// 	return response.json()
	// }

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
	// private async signOrder(_order: z.infer<typeof orderSchema>): Promise<`0x${string}`> {
	// 	if (!this.account) {
	// 		throw new Error('Account is required for signing orders')
	// 	}
	// 	// Implementation of order signing using signTypedData with viem
	// 	// Here we need to use the order structure from the schema to create typed data
	// 	throw new Error('Not implemented')
	// }

	// private async signDeleteOrder(_marketId: bigint, _orderId: string): Promise<`0x${string}`> {
	// 	if (!this.account) {
	// 		throw new Error('Account is required for signing delete order requests')
	// 	}

	// 	throw new Error('Not implemented')
	// }
}
