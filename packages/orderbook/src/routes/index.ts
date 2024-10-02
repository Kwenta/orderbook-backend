import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono, z } from '@hono/zod-openapi'
import { bookRouter } from './book'
import { demoRouter } from './demo'
import { marketRouter } from './markets'
import { orderRouter } from './orders'

import { HTTPException } from 'hono/http-exception'
import { logger } from 'hono/logger'
import type { ZodError } from 'zod'

const formatZodErrors = (result: ZodError<any>) => {
	const errors: { [key: string]: string } = {}
	for (const [key, value] of Object.entries(result.errors)) {
		errors[key] = value.message
	}
	return errors
}

export const app = new OpenAPIHono({
	defaultHook: (result, c) => {
		if (!result.success) {
			return c.json({ errors: formatZodErrors(result.error), message: 'Validation Failure' }, 400)
		}
	},
})

app.use(logger())

const routes = app
	.route('/book', bookRouter)
	.route('/markets', marketRouter)
	.route('/orders', orderRouter)
	.route('/demo', demoRouter)

export type AppRouter = typeof routes

app.doc('/doc', {
	openapi: '3.0.0',
	info: { version: '0.0.1', title: 'Kwenta Matching Engine API' },
})
app.get('/ui', swaggerUI({ url: '/doc' }))

app.onError((err, c) => {
	if (err instanceof HTTPException) {
		return c.json({ message: err.message }, err.status)
	}
	// console.error(e)
	return c.json({ message: 'An error occurred' }, 500)
})
