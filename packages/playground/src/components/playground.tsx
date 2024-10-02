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
import { OrderbookSDK } from 'orderbook-sdk'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { type FC, useEffect, useState } from 'react'
import { base } from 'viem/chains'
import { useAccount, useClient, useSignMessage, useSignTypedData, useWalletClient } from 'wagmi'

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

	const [sdk, setSdk] = useState<OrderbookSDK | null>(null)
	const [apiUrl, setApiUrl] = useState('http://localhost:3000')
	const [selectedMethod, setSelectedMethod] = useState<SDKMethod>('getMarkets')
	const [methodParams, setMethodParams] = useState<Record<string, string>>({})
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

	const handleMethodChange = (method: SDKMethod) => {
		setSelectedMethod(method)
		setMethodParams({})
		setResult('')
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
					response = await sdk.getMarkets()
					break
				case 'getMarket':
					response = await sdk.getMarket(BigInt(methodParams.id || '0'))
					break
				case 'getOrders':
					response = await sdk.getOrders(BigInt(methodParams.marketId || '0'))
					break
				case 'getOrder':
					if (!methodParams.marketId || !methodParams.orderId) {
						throw new Error('Market ID and Order ID are required')
					}
					response = await sdk.getOrder(BigInt(methodParams.marketId), methodParams.orderId)
					break
				// case 'createOrder':
				// 	if (!methodParams.marketId || !methodParams.order) {
				// 		throw new Error('Market ID and order data are required')
				// 	}
				// 	response = await sdk.createOrder(
				// 		BigInt(methodParams.marketId),
				// 		JSON.parse(methodParams.order)
				// 	)
				// 	break
				// case 'updateOrder':
				// 	if (!methodParams.marketId || !methodParams.orderId || !methodParams.order) {
				// 		throw new Error('Market ID, Order ID, and order data are required')
				// 	}
				// 	response = await sdk.updateOrder(
				// 		BigInt(methodParams.marketId),
				// 		methodParams.orderId,
				// 		JSON.parse(methodParams.order)
				// 	)
				// 	break
				// case 'deleteOrder':
				// 	if (!methodParams.marketId || !methodParams.orderId) {
				// 		throw new Error('Market ID and Order ID are required')
				// 	}
				// 	response = await sdk.deleteOrder(BigInt(methodParams.marketId), methodParams.orderId)
				// 	break
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
						<Label htmlFor="method-select">Method</Label>
						<Select onValueChange={handleMethodChange} value={selectedMethod}>
							<SelectTrigger id="method-select">
								<SelectValue placeholder="Select a method" />
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
							<Label htmlFor="market-id">Market ID</Label>
							<Input
								id="market-id"
								placeholder="Market ID"
								value={methodParams.id || ''}
								onChange={(e) => handleParamChange('id', e.target.value)}
							/>
						</div>
					)}

					{(selectedMethod === 'getOrders' || selectedMethod === 'createOrder') && (
						<div>
							<Label htmlFor="orders-market-id">Market ID</Label>
							<Input
								id="orders-market-id"
								placeholder="Market ID"
								value={methodParams.marketId || ''}
								onChange={(e) => handleParamChange('marketId', e.target.value)}
							/>
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

					{(selectedMethod === 'createOrder' || selectedMethod === 'updateOrder') && (
						<div>
							<Label htmlFor="order-data">Order Data (JSON)</Label>
							<Textarea
								id="order-data"
								placeholder="{ ... }"
								value={methodParams.order || ''}
								onChange={(e) => handleParamChange('order', e.target.value)}
							/>
						</div>
					)}

					<Button onClick={executeMethod} className="w-full" disabled={!sdk || !address}>
						Execute
					</Button>

					<div>
						<Label htmlFor="result">Result</Label>
						<Textarea id="result" value={result} readOnly className="font-mono h-64" />
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

export default Playground
