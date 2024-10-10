import { http } from './schemas'
import type { Order } from './types'

export const standardResponses = {
	400: http.badRequestSchema,
	404: http.notFoundSchema,
	500: http.internalServerErrorSchema,
} as const

export const marketSide = (order: Order) => (order.trade.size < BigInt(0) ? 'sell' : 'buy')
