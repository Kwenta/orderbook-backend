import { type Account, zeroAddress } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { TRACKING_CODE, markets } from '../../../src/constants'
import { app } from '../../../src/routes'
import { domain, hashOfOrder, orderTypes } from '../../../src/signing'
import { OrderType } from '../../../src/types'
;(BigInt.prototype as any).toJSON = function () {
	return this.toString()
}

const wallet = privateKeyToAccount(
	'0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
)

const addOrder = async (market: string, nonce: number, signer: Account) => {
	const order = {
		metadata: {
			genesis: Date.now().toString(),
			expiration: (Date.now() + 10 * 60 * 1000).toString(),
			trackingCode: TRACKING_CODE,
			referrer: zeroAddress,
		},
		trader: {
			nonce: nonce.toString(),
			accountId: BigInt(1).toString(),
			signer: signer.address,
		},
		trade: {
			t: OrderType.LIMIT,
			marketId: market,
			size: BigInt(1).toString(),
			price: BigInt(1).toString(),
		},
		conditions: [],
	}
	const signature = await signer.signTypedData({
		domain: domain(1n, zeroAddress),
		primaryType: 'Order',
		types: orderTypes,
		message: order,
	})
	const res = await app.request(`/orders/market/${market}`, {
		method: 'POST',
		body: JSON.stringify({
			order,
			user: signer.address,
			signature,
		}),
	})
	const orderRes = await res.json()
	return { order, id: orderRes.orderId, signature }
}

it('Adds an order', async () => {
	const marketId = markets[0].id
	const order = {
		metadata: {
			genesis: Date.now().toString(),
			expiration: (Date.now() + 10 * 60 * 1000).toString(),
			trackingCode: TRACKING_CODE,
			referrer: zeroAddress,
		},
		trader: {
			nonce: (1).toString(),
			accountId: BigInt(1).toString(),
			signer: wallet.address,
		},
		trade: {
			t: OrderType.LIMIT,
			marketId: marketId,
			size: BigInt(1).toString(),
			price: BigInt(1).toString(),
		},
		conditions: [],
	}

	const res = await app.request(`/orders/market/${marketId}`, {
		method: 'POST',
		body: JSON.stringify({
			order,
			user: wallet.address,
			signature: await wallet.signTypedData({
				domain: domain(1n, zeroAddress),
				primaryType: 'Order',
				types: orderTypes,
				message: order,
			}),
		}),
	})
	expect(res.status).toBe(201)
	const data = await res.json()
	expect(data).toEqual({ success: true, orderId: data.orderId })
})

it('Gets an order', async () => {
	const marketId = markets[0].id
	// Add order to get
	const { order, id: orderId, signature } = await addOrder(marketId, 1, wallet)

	const res = await app.request(`/orders/market/${marketId}/${orderId}`)
	expect(res.status).toBe(200)
	const data = await res.json()
	expect(data).toEqual({
		marketId,
		data: {
			order: {
				...order,
				marketId,
			},
			user: wallet.address,
			id: orderId,
			signature,
			timestamp: data.data.timestamp,
		},
		orderId,
	})
})

it.skip('Updates an order', async () => {
	const market = '1'
	const { order, id: orderId } = await addOrder(market, 1, wallet)

	const newOrder = structuredClone(order)

	newOrder.amount = 2n
	newOrder.marketId = market

	const res = await app.request(`/orders/market/${market}/${orderId}`, {
		method: 'PATCH',
		body: JSON.stringify({
			order: newOrder,
			signature: wallet.sign({
				hash: hashOfOrder(newOrder, zeroAddress, 1n),
			}),
			user: wallet.address,
		}),
	})

	expect(res.status).toBe(200)

	// TODO: Assert order is updated
	expect(await res.json()).toEqual({ success: true })
})

it.skip('Deletes an order', async () => {
	const market = '1'
	const { id: orderId } = await addOrder(market, 1, wallet)

	const res = await app.request(`/orders/market/${market}/${orderId}`, {
		method: 'DELETE',
		body: JSON.stringify({ signature: '0x' }),
	})
	expect(res.status).toBe(200)
	expect(await res.json()).toEqual({ success: true })
})
