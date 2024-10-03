import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { OrderType, OrderbookSDK } from 'orderbook-sdk'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { type FC, useEffect, useState } from 'react'
import { base } from 'viem/chains'
import { useAccount, useClient, useSignMessage, useSignTypedData } from 'wagmi'

const SDK_METHODS = [
	'getMarkets',
	'getMarket',
	'getOrders',
	'getOrder',
	'createOrder',
	'updateOrder',
	'deleteOrder',
] as const

type SDKMethod = (typeof SDK_METHODS)[number]

const Playground: FC = () => {
	const { address } = useAccount()
	const client = useClient()
	const { signMessageAsync } = useSignMessage()
	const { signTypedDataAsync } = useSignTypedData()
	const queryClient = useQueryClient()

	const [sdk, setSdk] = useState<OrderbookSDK | null>(null)
	const [apiUrl, setApiUrl] = useState('http://localhost:3000')
	const [selectedMethod, setSelectedMethod] = useState<SDKMethod>('getMarkets')
	const [methodParams, setMethodParams] = useState<Record<string, string>>({})
	const [selectedMarketId, setSelectedMarketId] = useState<string>('')
	const [result, setResult] = useState('')

	useEffect(() => {
		if (address && client?.chain?.id === base.id) {
			setSdk(
				new OrderbookSDK(apiUrl, client.chain.rpcUrls.default.http[0], {
					address,
					signMessage: signMessageAsync,
					signTypedData: signTypedDataAsync,
				})
			)
		}
	}, [address, client?.chain, apiUrl, signMessageAsync, signTypedDataAsync])

	const { data: markets } = useQuery({
		queryKey: ['markets'],
		queryFn: () => sdk?.getMarkets() ?? [],
		enabled: !!sdk,
	})

	const { data: orders, isLoading: isLoadingOrders } = useQuery({
		queryKey: ['orders', selectedMarketId],
		queryFn: () => sdk?.getOrders(BigInt(selectedMarketId)) ?? [],
		enabled: !!sdk && !!selectedMarketId,
		refetchInterval: 3000,
	})

	const handleMethodChange = (method: SDKMethod) => {
		setSelectedMethod(method)
		setMethodParams({})
		setResult('')
		if (method === 'createOrder') {
			setMethodParams({
				marketId: '',
				orderType: '',
				size: '',
				price: '',
			})
		}
	}

	const handleParamChange = (param: string, value: string) => {
		setMethodParams((prev) => ({ ...prev, [param]: value }))
	}

	const executeMethod = async () => {
		if (!sdk) return
		try {
			let response: any
			switch (selectedMethod) {
				case 'getMarkets':
					response = await queryClient.fetchQuery({
						queryKey: ['markets'],
						queryFn: () => sdk.getMarkets(),
					})
					break
				case 'getMarket':
					response = await sdk.getMarket(BigInt(methodParams.id || '0'))
					break
				case 'getOrders':
					response = orders
					break
				case 'getOrder':
					if (!methodParams.marketId || !methodParams.orderId) {
						throw new Error('Market ID and Order ID are required')
					}
					response = await sdk.getOrder(BigInt(methodParams.marketId), methodParams.orderId)
					break
				case 'createOrder':
					if (
						!methodParams.marketId ||
						!methodParams.orderType ||
						!methodParams.size ||
						!methodParams.price
					) {
						throw new Error('All fields are required')
					}
					response = await sdk.createOrder(
						BigInt(methodParams.marketId),
						methodParams.orderType as unknown as (typeof OrderType)[keyof typeof OrderType],
						BigInt(methodParams.size),
						methodParams.type as 'BUY' | 'SELL',
						BigInt(methodParams.price)
					)
					queryClient.invalidateQueries({ queryKey: ['orders', methodParams.marketId] })
					break
				default:
					throw new Error('Invalid method')
			}
			setResult(JSON.stringify(response, null, 2))
		} catch (error) {
			setResult(`Error: ${error instanceof Error ? error.message : String(error)}`)
		}
	}

	return (
		<Card className="w-full max-w-3xl mx-auto">
			<CardHeader>
				<CardTitle>OrderbookSDK Playground</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					<ConnectButton />

					<div>
						<Label htmlFor="api-url">API URL</Label>
						<Input
							id="api-url"
							placeholder="API URL"
							value={apiUrl}
							onChange={(e) => setApiUrl(e.target.value)}
						/>
					</div>

					<div>
						<Label htmlFor="method-select">Метод</Label>
						<Select onValueChange={handleMethodChange} value={selectedMethod}>
							<SelectTrigger id="method-select">
								<SelectValue placeholder="Выберите метод" />
							</SelectTrigger>
							<SelectContent>
								{SDK_METHODS.map((method) => (
									<SelectItem key={method} value={method}>
										{method}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{selectedMethod === 'getMarket' && (
						<div>
							<Label htmlFor="market-id">ID рынка</Label>
							<Select
								onValueChange={(value) => handleParamChange('id', value)}
								value={methodParams.id}
							>
								<SelectTrigger id="market-id">
									<SelectValue placeholder="Выберите рынок" />
								</SelectTrigger>
								<SelectContent>
									{markets?.map((market) => (
										<SelectItem key={market.id.toString()} value={market.id.toString()}>
											{market.symbol}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					{(selectedMethod === 'getOrders' || selectedMethod === 'createOrder') && (
						<div>
							<Label htmlFor="orders-market-id">ID рынка</Label>
							<Select
								onValueChange={(value) => {
									handleParamChange('marketId', value)
									setSelectedMarketId(value)
								}}
								value={methodParams.marketId}
							>
								<SelectTrigger id="orders-market-id">
									<SelectValue placeholder="Выберите рынок" />
								</SelectTrigger>
								<SelectContent>
									{markets?.map((market) => (
										<SelectItem key={market.id.toString()} value={market.id.toString()}>
											{market.symbol}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					{(selectedMethod === 'getOrder' ||
						selectedMethod === 'updateOrder' ||
						selectedMethod === 'deleteOrder') && (
						<>
							<div>
								<Label htmlFor="order-market-id">Market ID</Label>
								<Input
									id="order-market-id"
									placeholder="Market ID"
									value={methodParams.marketId || ''}
									onChange={(e) => handleParamChange('marketId', e.target.value)}
								/>
							</div>
							<div>
								<Label htmlFor="order-id">Order ID</Label>
								<Input
									id="order-id"
									placeholder="Order ID"
									value={methodParams.orderId || ''}
									onChange={(e) => handleParamChange('orderId', e.target.value)}
								/>
							</div>
						</>
					)}

					{selectedMethod === 'createOrder' && (
						<>
							<div>
								<Label htmlFor="create-order-type">Order Type</Label>
								<Select
									onValueChange={(value) => handleParamChange('orderType', value)}
									value={methodParams.orderType}
								>
									<SelectTrigger id="create-order-type">
										<SelectValue placeholder="Select order type" />
									</SelectTrigger>
									<SelectContent>
										{Object.entries(OrderType).map(([key, value]) => (
											<SelectItem key={key} value={value.toString()}>
												{key}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div>
								<Label htmlFor="create-order-size">Size</Label>
								<Input
									id="create-order-size"
									placeholder="Size"
									value={methodParams.size || ''}
									onChange={(e) => handleParamChange('size', e.target.value)}
								/>
							</div>
							<div>
								<Label htmlFor="create-order-price">Price</Label>
								<Input
									id="create-order-price"
									placeholder="Price"
									value={methodParams.price || ''}
									onChange={(e) => handleParamChange('price', e.target.value)}
								/>
							</div>
						</>
					)}

					<Button onClick={executeMethod} className="w-full" disabled={!sdk || !address}>
						Execute
					</Button>

					<div>
						<Label htmlFor="result">Result</Label>
						<Textarea
							id="result"
							value={isLoadingOrders ? 'Loading...' : result}
							readOnly
							className="font-mono h-64"
						/>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

export default Playground
