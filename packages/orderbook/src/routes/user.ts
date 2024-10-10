import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { Nonce } from '../engine/nonce'
import { http, solidity, userNonceSchema } from '../schemas'
import { standardResponses } from '../utils'

const query = z.object({ user: solidity.uint128() })

const route = createRoute({
	method: 'get',
	path: '/nonce',
	request: { query },
	responses: {
		200: http.okSchema(
			userNonceSchema,
			'Gets the latest nonce for the user based on known signatures'
		),
		...standardResponses,
	},
})

export const userRouter = new OpenAPIHono().openapi(route, async (c) => {
	const { user } = query.parse(c.req.query())

	const nonce = Nonce.get(user)
	const data = userNonceSchema.parse({ user, nonce: nonce.nonce, lastSeen: nonce.lastSeen })
	return c.json(data, 200)
})
