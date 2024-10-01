import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { findEngineOrFail } from '../engine/matching-engine'
import {
	bodySchema,
	hexString,
	marketId,
	orderSchema as oSchema,
	okSchema,
	orderId,
} from '../schemas'
import { standardResponses } from '../utils'

const orderSchema = z
	.object({
		id: z.string().describe('The unique identifier of the order'),
		order: oSchema,
		user: hexString,
		signature: hexString.refine((s) => s.length === 132, {
			message: 'Signature must be 132 characters long',
		}),
	})
	.openapi('SignedOrder')

const addOrderSchema = {
	params: z.object({ marketId }),
	body: {
		content: {
			'application/json': { schema: orderSchema.omit({ id: true }) },
		},
	},
}

const updateOrderSchema = {
	params: z.object({ marketId, orderId }),
	body: {
		content: {
			'application/json': {
				schema: orderSchema.merge(
					z.object({
						signature: hexString.refine((s) => s.length === 132, {
							message: 'Signature must be 132 characters long',
						}),
					})
				),
			},
		},
	},
}

const deleteOrderSchema = {
	params: z.object({ marketId, orderId }),
	body: bodySchema(z.object({ signature: z.string() })),
}

const addRoute = createRoute({
	method: 'post',
	path: '/{marketId}',
	request: addOrderSchema,
	responses: {
		201: okSchema(
			z.object({
				success: z.boolean({
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

const getQuerySchema = z.object({ marketId, orderId })

const getRoute = createRoute({
	method: 'get',
	path: '/{marketId}/{orderId}',
	request: {
		params: getQuerySchema,
	},
	responses: {
		200: okSchema(orderSchema.describe('Order data'), 'Get the data for an order'),
		...standardResponses,
	},
})

const getAllSchema = z.object({ marketId })

const getAllRoute = createRoute({
	method: 'get',
	path: '/{marketId}',
	request: {
		params: getAllSchema,
	},
	responses: {
		200: okSchema(z.array(orderSchema.describe('Order data')), 'Get the data for all orders '),
		...standardResponses,
	},
})

const deleteRoute = createRoute({
	method: 'delete',
	path: '/{marketId}/{orderId}',
	request: deleteOrderSchema,
	responses: {
		200: okSchema(
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
	request: updateOrderSchema,
	responses: {
		200: okSchema(
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
		const { marketId } = addOrderSchema.params.parse(c.req.param())
		const { order, signature, user } = addOrderSchema.body.content['application/json'].schema.parse(
			await c.req.json()
		)

		const engine = findEngineOrFail(marketId)

		const orderId = await engine.addOrder({
			order,
			user,
			signature,
		})

		return c.json({ success: true, orderId }, 201)
	})
	.openapi(getRoute, async (c) => {
		const { marketId, orderId } = getQuerySchema.parse(c.req.param())
		const engine = findEngineOrFail(marketId)
		const data = engine.getOrder(orderId)

		return c.json({ marketId, orderId, data }, 200)
	})
	.openapi(getAllRoute, async (c) => {
		const { marketId } = getAllSchema.parse(c.req.param())
		const engine = findEngineOrFail(marketId)
		const data = structuredClone(engine.getOrders())

		data.forEach((d) => {
			// @ts-expect-error - we don't want to expose the signature
			d.signature = undefined
		})

		return c.json(data, 200)
	})
	.openapi(updateRoute, async (c) => {
		const { marketId, orderId } = updateOrderSchema.params.parse(c.req.param())
		const newOrder = updateOrderSchema.body.content['application/json'].schema.parse(
			await c.req.json()
		)

		const engine = findEngineOrFail(marketId)
		await engine.updateOrder({ ...newOrder, id: orderId })

		return c.json({ success: true }, 200)
	})
	.openapi(deleteRoute, async (c) => {
		const { marketId, orderId } = deleteOrderSchema.params.parse(c.req.param())
		const { signature } = deleteOrderSchema.body.content['application/json'].schema.parse(
			await c.req.json()
		)

		const engine = findEngineOrFail(marketId)
		await engine.deleteOrder(orderId, signature)

		return c.json({ success: true }, 200)
	})
