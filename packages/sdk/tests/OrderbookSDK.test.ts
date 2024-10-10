import { type PrivateKeyAccount, generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { OrderbookSDK } from '../src/index'
import { MockApiClient } from './mocks/MockApiClient'

describe('OrderbookSDK', () => {
	let sdk: OrderbookSDK
	let mockAccount: PrivateKeyAccount
	let mockApiClient: MockApiClient

	beforeEach(() => {
		mockAccount = privateKeyToAccount(generatePrivateKey())
		mockApiClient = new MockApiClient()
		sdk = new OrderbookSDK('https://api.example.com', 'https://rpc.example.com', mockAccount)
		;(sdk as any).client = mockApiClient
	})

	describe('getMarkets', () => {
		it('should return markets', async () => {
			const markets = await sdk.getMarkets()
			expect(markets).toHaveLength(2)
			expect(markets[0].id).toBe('1')
		})
	})

	// describe('createOrder', () => {
	// 	it('should create an order', async () => {
	// 		const order = await sdk.createOrder(1n, 2, 100n, 1000n)
	// 		expect(order.id).toBeDefined()
	// 		expect(mockAccount.signTypedData).toHaveBeenCalled()
	// 	})
	// })

	// TODO: Add more tests for other methods
})
