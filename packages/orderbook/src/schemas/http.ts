import { z } from '@hono/zod-openapi'
import type { ZodSchema } from 'zod'

export const bodySchema = <T extends z.ZodSchema>(schema: T) =>
	({
		content: {
			'application/json': {
				schema,
			},
		},
	}) as const

export const okSchema = <T extends z.ZodSchema>(
	schema: T,
	description = ''
): {
	content: {
		'application/json': {
			schema: T
		}
	}
	description: string
} =>
	({
		content: {
			'application/json': {
				schema,
			},
		},
		description,
	}) as const

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

export type Body<T extends { body: { content: { 'application/json': { schema: ZodSchema } } } }> =
	z.infer<T['body']['content']['application/json']['schema']>
