import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { OrderType } from 'orderbook-sdk'
import { type FC, useEffect, useMemo, useState } from 'react'

interface EditOrderModalProps {
	isOpen: boolean
	onClose: () => void
	onSubmit: (editedOrder: {
		orderType: string
		size: string
		side: 'BUY' | 'SELL'
		price: string
	}) => void
	initialOrder: {
		orderType: string
		size: string
		side: 'BUY' | 'SELL'
		price: string
	}
}

const EditOrderModal: FC<EditOrderModalProps> = ({ isOpen, onClose, onSubmit, initialOrder }) => {
	const [editedOrder, setEditedOrder] = useState(initialOrder)

	useEffect(() => {
		setEditedOrder(initialOrder)
	}, [initialOrder])

	const handleChange = (field: string, value: string) => {
		setEditedOrder((prev) => ({ ...prev, [field]: value }))
	}

	const isOrderValid = useMemo(() => {
		return (
			editedOrder.orderType !== '' &&
			editedOrder.size !== '' &&
			editedOrder.price !== '' &&
			Number(editedOrder.size) > 0 &&
			Number(editedOrder.price) > 0
		)
	}, [editedOrder])

	const handleSubmit = () => {
		if (isOrderValid) {
			onSubmit(editedOrder)
			onClose()
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Order</DialogTitle>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div>
						<Label htmlFor="edit-order-side">Side</Label>
						<Select onValueChange={(value) => handleChange('side', value)} value={editedOrder.side}>
							<SelectTrigger id="edit-order-side">
								<SelectValue placeholder="Select side" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="BUY">BUY</SelectItem>
								<SelectItem value="SELL">SELL</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div>
						<Label htmlFor="edit-order-type">Type</Label>
						<Select
							onValueChange={(value) => handleChange('orderType', value)}
							value={editedOrder.orderType}
						>
							<SelectTrigger id="edit-order-type">
								<SelectValue placeholder="Select type" />
							</SelectTrigger>
							<SelectContent>
								{Object.keys(OrderType).map((key) => (
									<SelectItem key={key} value={key}>
										{key}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div>
						<Label htmlFor="edit-order-price">Price</Label>
						<Input
							id="edit-order-price"
							value={editedOrder.price}
							onChange={(e) => handleChange('price', e.target.value)}
							type="number"
							min="0"
							step="0.01"
						/>
					</div>
					<div>
						<Label htmlFor="edit-order-size">Size</Label>
						<Input
							id="edit-order-size"
							value={editedOrder.size}
							onChange={(e) => handleChange('size', e.target.value)}
							type="number"
							min="0"
							step="0.01"
						/>
					</div>
				</div>
				<DialogFooter>
					<Button onClick={handleSubmit} disabled={!isOrderValid}>
						Save Changes
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

export default EditOrderModal
