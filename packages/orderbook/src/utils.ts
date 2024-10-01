import { badRequestSchema, internalServerErrorSchema, notFoundSchema } from './schemas'

export const standardResponses = {
	400: badRequestSchema,
	404: notFoundSchema,
	500: internalServerErrorSchema,
} as const
