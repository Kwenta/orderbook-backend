import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { findEngineOrFail } from '../engine/matching-engine'
import { marketId, okSchema, orderSchema, paginationSchema } from '../schemas'
import { standardResponses } from '../utils'

const query = paginationSchema.merge(z.object({ marketId }))
const returnSchema = z.object({ marketId, orders: z.array(orderSchema) }).openapi('Book')

const route = createRoute({
	method: 'get',
	path: '/',
	request: { query },
	responses: {
		200: okSchema(returnSchema, 'Retrieve the book for a specific market'),
	},
	...standardResponses,
})

export const bookRouter = new OpenAPIHono().openapi(route, (c) => {
	const { offset, limit, marketId } = query.parse(c.req.query())

	const engine = findEngineOrFail(marketId)
	const orders = engine.getOrders()

	const slicedOrders = orders.slice(offset, offset + limit)

	return c.json(returnSchema.parse({ marketId, orders: slicedOrders }), 200)
})
