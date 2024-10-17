import NodeCache from 'node-cache'

/**
 * Wraps a function into a memo allowing for fasted (cached) repeat calls
 * @param cacheTime Time to keep the return value
 * @returns A function that behaves the same as the input function, but holds onto return values for a period of time to speed up repeat calls
 */
export const memo =
	(cacheTime: number) =>
	<T extends any[], U>(fn: (...args: T) => U) => {
		const cache = new NodeCache({ stdTTL: cacheTime })

		return (...args: T): U => {
			const key = JSON.stringify(args)
			let value = cache.get<U>(key)
			if (value === undefined) {
				value = fn(...args)
				cache.set(key, value)
			}
			return value
		}
	}

/**
 * Wraps an async function into a memo allowing for fasted (cached) repeat calls
 * @param cacheTime Time to keep the return value
 * @returns A function that behaves the same as the input function, but holds onto return values for a period of time to speed up repeat calls
 */
export const memoAsync =
	(cacheTime: number) =>
	<T extends any[], U>(fn: (...args: T) => Promise<U>) => {
		const cache = new NodeCache({ stdTTL: cacheTime })

		return async (...args: T): Promise<U> => {
			const key = JSON.stringify(args)
			let value = cache.get<U>(key)
			if (value === undefined) {
				value = await fn(...args)
				cache.set(key, value)
			}
			return value
		}
	}
