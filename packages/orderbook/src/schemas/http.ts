import { z } from '@hono/zod-openapi'
import type { ZodSchema } from 'zod'

/**
 * Used to wrap a basic zod schema into a JSON body for hono
 * @param schema The schema of the JSON body of the request
 * @returns A schema used for hono that checks the body
 */
export const bodySchema = <T extends z.ZodSchema>(schema: T) =>
	({
		content: {
			'application/json': {
				schema,
			},
		},
	}) as const

/**
 * Wraps a schema into a return type for hono
 * @param schema The schema of thr JSON response
 * @param description A description of what the response does
 * @returns A schema used to validate the return in hono
 */
export const okSchema = <T extends z.ZodSchema>(schema: T, description = '') =>
	({
		content: {
			'application/json': {
				schema,
			},
		},
		description,
	}) as const

/**
 * A standard response for a 404 error
 */
export const notFoundSchema = {
	content: {
		'application/json': {
			schema: z.object({
				message: z.string(),
			}),
		},
	},
	description: 'The requested resource was not found',
}

/**
 * A standard response for a 400 error (typically from zod)
 */
export const badRequestSchema = {
	content: {
		'application/json': {
			schema: z.object({
				message: z.string(),
			}),
		},
	},
	description: 'The request was malformed',
}

/**
 * A standard response for a 500 error (typically from a thrown error or unplanned issue)
 */
export const internalServerErrorSchema = {
	content: {
		'application/json': {
			schema: z.object({
				message: z.string(),
			}),
		},
	},
	description: 'Something went wrong internally',
}

/**
 * A type to unwrap the body type from a schema into a simple type
 */
export type Body<T extends { body: { content: { 'application/json': { schema: ZodSchema } } } }> =
	z.infer<T['body']['content']['application/json']['schema']>
