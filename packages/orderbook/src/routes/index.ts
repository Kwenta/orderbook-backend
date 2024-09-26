import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono, z } from '@hono/zod-openapi'
import { bookRouter } from './book'
import { demoRouter } from './demo'
import { marketRouter } from './markets'
import { orderRouter } from './orders'

import { HTTPException } from 'hono/http-exception'
import { logger } from 'hono/logger'

export const app = new OpenAPIHono({
	defaultHook: (result, c) => {
		if (!result.success) {
			return c.json(
				{
					ok: false,
					errors: formatZodErrors(result),
					source: 'custom_error_handler',
				},
				422
			)
		}
	},
})

app.use(logger())

app.route('/book', bookRouter)
app.route('/markets', marketRouter)
app.route('/orders', orderRouter)
app.route('/demo', demoRouter)

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
