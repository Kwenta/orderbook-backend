import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { loadMarkets } from '../markets'
import { marketId, okSchema } from '../schemas'
import { standardResponses } from '../utils'

const query = z.object({ marketId: marketId.optional() })
const marketSchema = z.object({ id: marketId, symbol: z.string() }).openapi('Market')
const returnSchema = z.array(marketSchema).openapi('Markets')

const route = createRoute({
	method: 'get',
	path: '/',
	request: { query },
	responses: {
		200: okSchema(returnSchema, 'Retrieve the details about a specific market or all markets'),
		...standardResponses,
	},
})

export const marketRouter = new OpenAPIHono().openapi(route, async (c) => {
	const { marketId } = query.parse(c.req.query())
	const markets = await loadMarkets()
	const data = returnSchema.parse(marketId ? markets.filter((m) => m.id === marketId) : markets)
	return c.json(data, 200)
})
