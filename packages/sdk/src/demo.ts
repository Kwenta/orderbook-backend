import { OrderbookSDK } from './index'

const orderbook = new OrderbookSDK('http://localhost:3000')

async function demo() {
	console.log('Getting markets...')
	const markets = await orderbook.getMarkets()
	console.log(markets)

	console.log('Get BTC market...')
	const btcMarket = await orderbook.getMarket(BigInt(200))
	console.log(btcMarket)

	console.log('Get orders for BTC market...')
	const btcOrders = await orderbook.getOrders(BigInt(200))
	console.log(btcOrders)
}

demo()
