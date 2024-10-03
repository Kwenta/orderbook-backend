import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono, z } from '@hono/zod-openapi'
import { bookRouter } from './book'
import { demoRouter } from './demo'
import { marketRouter } from './markets'
import { orderRouter } from './orders'
import { userRouter } from './user'

import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { logger } from 'hono/logger'
import { ZodError } from 'zod'

export const app = new OpenAPIHono({})

app.use(logger())
app.use(
	cors({
		origin: '*',
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowHeaders: ['Accept', 'Content-Type', 'Authorization'],
	})
)
const routes = app
	.route('/book', bookRouter)
	.route('/markets', marketRouter)
	.route('/orders', orderRouter)
	.route('/demo', demoRouter)
	.route('/user', userRouter)

export type AppRouter = typeof routes

app.doc('/doc', {
	openapi: '3.0.0',
	info: { version: '0.0.1', title: 'Kwenta Matching Engine API' },
})

app.get('/ui', swaggerUI({ url: '/doc' }))

const formatZodErrors = (result: ZodError<any>) => {
	const errors: { [key: string]: string } = {}
	for (const { path, message } of result.errors) {
		errors[path.join('.')] = message
	}
	return errors
}

app.onError((err, c) => {
	if (err instanceof ZodError) {
		return c.json({ errors: formatZodErrors(err), message: 'Validation Failure' }, 400)
	}
	if (err instanceof HTTPException) {
		return c.json({ message: err.message }, err.status)
	}
	console.error(err)
	return c.json({ message: 'An error occurred' }, 500)
})
