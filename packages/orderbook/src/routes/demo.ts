import { readFileSync } from 'fs'
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'

const demoRoute = createRoute({
	method: 'get',
	path: '/',
	responses: {
		200: {
			content: {
				'text/html': { schema: z.any() },
			},
			description: 'The Demo page for testing the backend',
		},
	},
})

// @ts-expect-error
export const demoRouter = new OpenAPIHono().openapi(demoRoute, (c) => {
	const demoCSS = readFileSync('./static/index.css', 'utf-8')
	const demoPage = readFileSync('./static/index.html', 'utf-8').replace(
		'<title>Dashboard</title>',
		`<title>Dashboard</title>\n<style>\n${demoCSS}
          </style>`
	)

	return c.html(demoPage)
})
