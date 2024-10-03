import { useQuery, useQueryClient } from '@tanstack/react-query'
import { OrderType, OrderbookSDK } from 'orderbook-sdk'
import { useCallback, useEffect, useState } from 'react'
import { base } from 'viem/chains'
import { useAccount, useClient, useSignMessage, useSignTypedData } from 'wagmi'

export const useOrderbook = () => {
	const { address } = useAccount()
	const client = useClient()
	const { signMessageAsync } = useSignMessage()
	const { signTypedDataAsync } = useSignTypedData()
	const queryClient = useQueryClient()

	const [sdk, setSdk] = useState<OrderbookSDK | null>(null)
	const [selectedMarketId, setSelectedMarketId] = useState<string>('')

	useEffect(() => {
		if (address && client?.chain?.id === base.id) {
			setSdk(
				new OrderbookSDK('http://localhost:3000', client.chain.rpcUrls.default.http[0], {
					address,
					signMessage: signMessageAsync,
					signTypedData: signTypedDataAsync,
				})
			)
		}
	}, [address, client?.chain, signMessageAsync, signTypedDataAsync])

	const { data: markets, isLoading: isLoadingMarkets } = useQuery({
		queryKey: ['markets'],
		queryFn: () => sdk?.getMarkets() ?? [],
		enabled: !!sdk,
	})

	const { data: orders, isLoading: isLoadingOrders } = useQuery({
		queryKey: ['orders', selectedMarketId],
		queryFn: () => sdk?.getOrders(BigInt(selectedMarketId)) ?? [],
		enabled: !!sdk && !!selectedMarketId,
		refetchInterval: 5000,
	})

	const { data: userOrders, isLoading: isLoadingUserOrders } = useQuery({
		queryKey: ['userOrders', address],
		queryFn: async () => {
			if (!sdk || !address) return []
			const allMarkets = await sdk.getMarkets()
			const userOrdersPromises = allMarkets.map(async (market) => {
				const orders = await sdk.getOrders(market.id)
				return orders
					.filter((order) => order.order.trader.signer === address)
					.map((order) => ({
						...order,
						marketSymbol: market.symbol, // Добавляем символ маркета к каждому ордеру
					}))
			})
			const userOrdersNested = await Promise.all(userOrdersPromises)
			return userOrdersNested.flat()
		},
		enabled: !!sdk && !!address,
		refetchInterval: 10000,
	})

	const invalidateQueries = useCallback(() => {
		queryClient.invalidateQueries({ queryKey: ['orders', selectedMarketId] })
		queryClient.invalidateQueries({ queryKey: ['userOrders', address] })
	}, [queryClient, selectedMarketId, address])

	const createOrder = async (orderData: {
		marketId: string
		type: string
		size: string
		side: 'BUY' | 'SELL'
		price: string
	}) => {
		if (!sdk) return
		try {
			const response = await sdk.createOrder(
				BigInt(orderData.marketId),
				OrderType[orderData.type as keyof typeof OrderType],
				BigInt(orderData.size),
				orderData.side,
				BigInt(orderData.price)
			)
			console.log('Order created:', response)
			invalidateQueries()
		} catch (error) {
			console.error('Error creating order:', error)
		}
	}

	const cancelOrder = async (marketId: string, orderId: string) => {
		if (!sdk) return
		try {
			const response = await sdk.deleteOrder(BigInt(marketId), orderId)
			console.log('Order deleted:', response)
			invalidateQueries()
		} catch (error) {
			console.error('Error deleting order:', error)
		}
	}

	const editOrder = async (
		marketId: string,
		orderId: string,
		editedOrder: {
			orderType: string
			size: string
			side: 'BUY' | 'SELL'
			price: string
		}
	) => {
		if (!sdk) return
		try {
			const response = await sdk.editOrder(
				BigInt(marketId),
				orderId,
				OrderType[editedOrder.orderType as keyof typeof OrderType],
				BigInt(editedOrder.size),
				editedOrder.side,
				BigInt(editedOrder.price)
			)
			console.log('Order edited:', response)
			invalidateQueries()
		} catch (error) {
			console.error('Error editing order:', error)
		}
	}

	return {
		sdk,
		markets,
		orders,
		userOrders,
		isLoadingMarkets,
		isLoadingOrders,
		isLoadingUserOrders,
		selectedMarketId,
		setSelectedMarketId,
		createOrder,
		cancelOrder,
		editOrder,
	}
}
