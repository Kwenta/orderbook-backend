import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { markets } from '../../constants'
import { marketId, okSchema } from '../../schemas'
import { makeSafe, standardResponses } from '../../utils'

export const marketRouter = new OpenAPIHono()

const route = createRoute({
	method: 'get',
	path: '/{marketId?}',
	request: {
		params: z.object({ marketId: marketId.optional() }),
	},
	responses: {
		200: okSchema(
			z.array(z.object({ marketId })),
			'Retrieve the details about a specific market or all markets'
		),
	},
	...standardResponses,
})

marketRouter.openapi(
	route,
	makeSafe((c) => {
		const { marketId } = c.req.param()
		if (!marketId) return c.json({ markets })
		return c.json({ markets: markets.filter((m) => m.id === marketId) })
	})
)
