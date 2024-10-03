import { http } from './schemas'

export const standardResponses = {
	400: http.badRequestSchema,
	404: http.notFoundSchema,
	500: http.internalServerErrorSchema,
} as const
