import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { chainId, domainName, domainVersion, verifyingContract } from '..//env'
import { http, apiMetaSchema, marketId, marketsSchema } from '../schemas'
import { standardResponses } from '../utils'

const route = createRoute({
	method: 'get',
	path: '/',
	request: {},
	responses: {
		200: http.okSchema(apiMetaSchema, 'Retrieve the details to init the SDK'),
		...standardResponses,
	},
})

export const metadataRouter = new OpenAPIHono().openapi(route, async (c) => {
	return c.json({ chainId, verifyingContract, name: domainName, version: domainVersion }, 200)
})
