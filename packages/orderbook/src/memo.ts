import NodeCache from 'node-cache'

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
