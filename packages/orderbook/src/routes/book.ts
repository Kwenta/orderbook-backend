import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { findEngineOrFail } from '../engine/matching-engine'
import { http, bookSchema, marketPaginationSchema } from '../schemas'
import { standardResponses } from '../utils'

const route = createRoute({
	method: 'get',
	path: '/',
	request: { query: marketPaginationSchema },
	responses: {
		200: http.okSchema(bookSchema, 'Retrieve the book for a specific market'),
	},
	...standardResponses,
})

export const bookRouter = new OpenAPIHono().openapi(route, (c) => {
	const { offset, limit, marketId } = route.request.query.parse(c.req.query())

	const engine = findEngineOrFail(marketId)
	const orders = engine.getOrders()

	const slicedOrders = orders.slice(offset, offset + limit)

	return c.json(bookSchema.parse({ marketId, orders: slicedOrders }), 200)
})
