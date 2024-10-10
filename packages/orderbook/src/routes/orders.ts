import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { MatchingEngine } from '../engine/matching-engine'
import {
	http,
	marketId,
	orderId,
	signedOrderSchema,
	solidity,
	unsignedOrderSchema,
} from '../schemas'
import { standardResponses } from '../utils'

const addRoute = createRoute({
	method: 'post',
	path: '/{marketId}',
	request: {
		params: z.object({ marketId }),
		body: {
			content: {
				'application/json': { schema: signedOrderSchema.omit({ id: true, user: true }) },
			},
		},
	},
	responses: {
		201: http.okSchema(
			z.object({
				success: z.literal(true, {
					description: 'If the order was added to the book',
				}),
				orderId: z.string({
					description: 'The unique identifier of the order',
				}),
			}),
			'Add an order to the book for a specific market'
		),
		...standardResponses,
	},
})

const getRoute = createRoute({
	method: 'get',
	path: '/{marketId}/{orderId}',
	request: {
		params: z.object({ marketId, orderId }),
	},
	responses: {
		200: http.okSchema(unsignedOrderSchema, 'Get the data for an order'),
		...standardResponses,
	},
})

const getAllRoute = createRoute({
	method: 'get',
	path: '/{marketId}',
	request: {
		params: z.object({ marketId }),
	},
	responses: {
		200: http.okSchema(z.array(unsignedOrderSchema), 'Get the data for all orders '),
		...standardResponses,
	},
})

const deleteRoute = createRoute({
	method: 'delete',
	path: '/{marketId}/{orderId}',
	request: {
		params: z.object({ marketId, orderId }),
		body: http.bodySchema(z.object({ signature: solidity.Signature() })),
	},
	responses: {
		200: http.okSchema(
			z.object({
				success: z.boolean({
					description: 'If the order was removed from the book',
				}),
			}),
			'Remove an order from the book of a specific market'
		),
		...standardResponses,
	},
})

const updateRoute = createRoute({
	method: 'patch',
	path: '/{marketId}/{orderId}',
	request: {
		params: z.object({ marketId, orderId }),
		body: {
			content: {
				'application/json': {
					schema: signedOrderSchema,
				},
			},
		},
	},
	responses: {
		200: http.okSchema(
			z.object({
				success: z.boolean({ description: 'If the order was updated' }),
			}),
			'Update an order in the book of a specific market'
		),
		...standardResponses,
	},
})

export const orderRouter = new OpenAPIHono()
	.openapi(addRoute, async (c) => {
		const { marketId } = addRoute.request.params.parse(c.req.param())
		const { order, signature } = addRoute.request.body.content['application/json'].schema.parse(
			await c.req.json()
		)

		const engine = MatchingEngine.findOrFail(marketId)
		const orderId = await engine.addOrder({ order, signature })

		return c.json({ success: true as const, orderId }, 201)
	})
	.openapi(getRoute, async (c) => {
		const { marketId, orderId } = getRoute.request.params.parse(c.req.param())
		const engine = MatchingEngine.findOrFail(marketId)
		const order = engine.getOrderWithoutSig(orderId)!

		return c.json(order, 200)
	})
	.openapi(getAllRoute, async (c) => {
		const { marketId } = getAllRoute.request.params.parse(c.req.param())
		const engine = MatchingEngine.findOrFail(marketId)
		const data = structuredClone(engine.getOrdersWithoutSigs())

		return c.json(data, 200)
	})
	.openapi(updateRoute, async (c) => {
		const { marketId, orderId } = updateRoute.request.params.parse(c.req.param())
		const newOrder = updateRoute.request.body.content['application/json'].schema.parse(
			await c.req.json()
		)

		const engine = MatchingEngine.findOrFail(marketId)
		await engine.updateOrder({ ...newOrder, id: orderId })

		return c.json({ success: true }, 200)
	})
	.openapi(deleteRoute, async (c) => {
		const { marketId, orderId } = deleteRoute.request.params.parse(c.req.param())
		const { signature } = deleteRoute.request.body.content['application/json'].schema.parse(
			await c.req.json()
		)

		const engine = MatchingEngine.findOrFail(marketId)
		await engine.deleteOrder(orderId, signature)

		return c.json({ success: true }, 200)
	})
