import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { OrderType } from 'orderbook-sdk'
import { type FC, useState } from 'react'
import { useOrderbook } from '../lib/useOrderbook'
import EditOrderModal from './EditOrderModal'

const PlaygroundSecond: FC = () => {
	const {
		markets,
		orders,
		userOrders,
		isLoadingOrders,
		isLoadingUserOrders,
		selectedMarketId,
		setSelectedMarketId,
		createOrder,
		cancelOrder,
		editOrder,
	} = useOrderbook()

	const [orderForm, setOrderForm] = useState({
		side: 'BUY' as 'BUY' | 'SELL',
		type: '',
		price: '1',
		size: '1',
	})

	const [isEditModalOpen, setIsEditModalOpen] = useState(false)
	const [editingOrder, setEditingOrder] = useState<any>(null)

	const handleOrderFormChange = (field: string, value: string) => {
		setOrderForm((prev) => ({ ...prev, [field]: value }))
	}

	const handleCreateOrder = () => {
		createOrder({
			marketId: selectedMarketId,
			...orderForm,
		})
	}

	const openEditModal = (order: any) => {
		setEditingOrder({
			id: order.id,
			orderType: order.order.trade.t.toString(),
			size: Math.abs(Number(order.order.trade.size)).toString(),
			side: Number(order.order.trade.size) > 0 ? 'BUY' : 'SELL',
			price: order.order.trade.price.toString(),
			marketId: order.order.trade.marketId.toString(),
		})
		setIsEditModalOpen(true)
	}

	const closeEditModal = () => {
		setIsEditModalOpen(false)
		setEditingOrder(null)
	}

	const handleEditOrder = (editedOrder: {
		orderType: string
		size: string
		side: 'BUY' | 'SELL'
		price: string
	}) => {
		if (!editingOrder) return
		editOrder(editingOrder.marketId, editingOrder.id, editedOrder)
		closeEditModal()
	}

	const handleMarketSelect = (marketId: string) => {
		setSelectedMarketId(marketId)
	}

	const renderOrderTable = (
		ordersData: any[],
		isLoading: boolean,
		emptyMessage: string,
		isUserOrders: boolean
	) => (
		<div className="bg-gray-900 rounded-lg overflow-hidden">
			{isLoading ? (
				<p className="text-center py-4 text-gray-400">Loading orders...</p>
			) : ordersData && ordersData.length > 0 ? (
				<Table>
					<TableHeader>
						<TableRow className="bg-gray-800">
							{isUserOrders && <TableHead className="text-gray-400">Market</TableHead>}
							<TableHead className="text-gray-400">Type</TableHead>
							<TableHead className="text-gray-400">Size</TableHead>
							<TableHead className="text-gray-400">Price</TableHead>
							{isUserOrders && <TableHead className="text-gray-400">Actions</TableHead>}
						</TableRow>
					</TableHeader>
					<TableBody>
						{ordersData.map((order) => (
							<TableRow key={order.id} className="border-b border-gray-800">
								{isUserOrders && (
									<TableCell>
										<Button
											variant="link"
											onClick={() => handleMarketSelect(order.order.trade.marketId.toString())}
											className="text-blue-400 hover:text-blue-300"
										>
											{order.marketSymbol}
										</Button>
									</TableCell>
								)}
								<TableCell className="text-gray-300">{order.order.trade.t}</TableCell>
								<TableCell className="text-gray-300">{String(order.order.trade.size)}</TableCell>
								<TableCell className="text-gray-300">{String(order.order.trade.price)}</TableCell>
								{isUserOrders && (
									<TableCell>
										<Button
											onClick={() => cancelOrder(String(order.order.trade.marketId), order.id)}
											className="mr-2 bg-red-600 hover:bg-red-700 text-white"
											size="sm"
										>
											Cancel
										</Button>
										<Button
											onClick={() => openEditModal(order)}
											size="sm"
											className="bg-blue-600 hover:bg-blue-700 text-white"
										>
											Edit
										</Button>
									</TableCell>
								)}
							</TableRow>
						))}
					</TableBody>
				</Table>
			) : (
				<p className="text-center py-4 text-gray-400">{emptyMessage}</p>
			)}
		</div>
	)

	return (
		<div className="min-h-screen bg-gray-900 text-white p-4">
			<div className="max-w-7xl mx-auto">
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-2xl font-bold">Exchange Interface</h1>
					<ConnectButton />
				</div>

				<div className="grid grid-cols-3 gap-6">
					<Card className="col-span-2 bg-gray-800 border-gray-700">
						<CardContent className="p-4">
							<h2 className="text-lg font-semibold mb-4">Market Overview</h2>
							{renderOrderTable(
								orders || [],
								isLoadingOrders,
								'No orders available for this market',
								false
							)}
						</CardContent>
					</Card>

					<Card className="bg-gray-800 border-gray-700">
						<CardContent className="p-4">
							<h2 className="text-lg font-semibold mb-4">Create Order</h2>
							<div className="space-y-4">
								<div>
									<Label htmlFor="market-select" className="text-gray-400">
										Market
									</Label>
									<Select onValueChange={handleMarketSelect} value={selectedMarketId}>
										<SelectTrigger
											id="market-select"
											className="bg-gray-700 border-gray-600 text-white"
										>
											<SelectValue placeholder="Select a market" />
										</SelectTrigger>
										<SelectContent className="bg-gray-700 border-gray-600">
											{markets?.map((market) => (
												<SelectItem
													key={market.id.toString()}
													value={market.id.toString()}
													className="text-white"
												>
													{market.symbol}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div>
									<Label htmlFor="order-side" className="text-gray-400">
										Side
									</Label>
									<Select
										onValueChange={(value) => handleOrderFormChange('side', value)}
										value={orderForm.side}
									>
										<SelectTrigger
											id="order-side"
											className="bg-gray-700 border-gray-600 text-white"
										>
											<SelectValue placeholder="Select side" />
										</SelectTrigger>
										<SelectContent className="bg-gray-700 border-gray-600">
											<SelectItem value="BUY" className="text-white">
												BUY
											</SelectItem>
											<SelectItem value="SELL" className="text-white">
												SELL
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div>
									<Label htmlFor="order-type" className="text-gray-400">
										Type
									</Label>
									<Select
										onValueChange={(value) => handleOrderFormChange('type', value)}
										value={orderForm.type}
									>
										<SelectTrigger
											id="order-type"
											className="bg-gray-700 border-gray-600 text-white"
										>
											<SelectValue placeholder="Select type" />
										</SelectTrigger>
										<SelectContent className="bg-gray-700 border-gray-600">
											{Object.keys(OrderType).map((key) => (
												<SelectItem key={key} value={key} className="text-white">
													{key}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div>
									<Label htmlFor="order-price" className="text-gray-400">
										Price
									</Label>
									<Input
										id="order-price"
										placeholder="Price"
										value={orderForm.price}
										onChange={(e) => handleOrderFormChange('price', e.target.value)}
										className="bg-gray-700 border-gray-600 text-white"
									/>
								</div>
								<div>
									<Label htmlFor="order-size" className="text-gray-400">
										Size
									</Label>
									<Input
										id="order-size"
										placeholder="Size"
										value={orderForm.size}
										onChange={(e) => handleOrderFormChange('size', e.target.value)}
										className="bg-gray-700 border-gray-600 text-white"
									/>
								</div>
								<Button
									onClick={handleCreateOrder}
									className="w-full bg-green-600 hover:bg-green-700 text-white"
									disabled={!selectedMarketId}
								>
									Create Order
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>

				<Card className="mt-6 bg-gray-800 border-gray-700">
					<CardContent className="p-4">
						<h2 className="text-lg font-semibold mb-4">Your Orders</h2>
						{renderOrderTable(
							userOrders || [],
							isLoadingUserOrders,
							'You have no active orders',
							true
						)}
					</CardContent>
				</Card>
			</div>

			<EditOrderModal
				isOpen={isEditModalOpen}
				onClose={closeEditModal}
				onSubmit={handleEditOrder}
				initialOrder={editingOrder || { orderType: '', size: '', side: 'BUY', price: '' }}
			/>
		</div>
	)
}

export default PlaygroundSecond
