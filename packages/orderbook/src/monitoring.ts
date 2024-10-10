import { logger } from './logger'

const perfMetrics: {
	[className: string]: { [methodName: string]: { count: bigint; total: bigint } }
} = {}

const pad = (n: bigint, width: number) => n.toString().padStart(width, '0')

export const formatTime = (time: bigint) => {
	let num = time

	const m = num / BigInt(6e10)
	num -= m * BigInt(6e10)

	const s = num / BigInt(1e9)
	num -= s * BigInt(1e9)

	const ms = num / BigInt(1e6)
	num -= ms * BigInt(1e6)
	const μs = num / BigInt(1e3)
	num -= μs * BigInt(1e3)

	return `${pad(m, 2)}m ${pad(s, 2)}s ${pad(ms, 3)}ms ${pad(μs, 3)}μs ${pad(num, 3)}ns`
}

const addToMetrics = (objName: string, name: string, time: bigint) => {
	if (!perfMetrics[objName]) {
		perfMetrics[objName] = {}
	}
	perfMetrics[objName][name] ??= { count: 0n, total: 0n }
	const perf = perfMetrics[objName][name]
	perf.count++
	perf.total += time
}

const printMetrics = () => {
	logger.debug('Performance metrics:')
	for (const [objName, methods] of Object.entries(perfMetrics)) {
		for (const [name, { count, total }] of Object.entries(methods)) {
			if (count > 0n) {
				logger.debug(
					`  ${objName.padEnd(30, ' ')}: ${name.padEnd(30, ' ')}:${formatTime(total / count)}`
				)
			}
		}
	}
}

setInterval(printMetrics, 1000)

export const perfFunc =
	(name: string, objName = '') =>
	<T extends any[], U>(fn: (...args: T) => U) => {
		return (...args: T): U => {
			const start = process.hrtime.bigint()
			try {
				const res = fn(...args)
				addToMetrics(objName, name, process.hrtime.bigint() - start)
				return res
			} catch (e) {
				addToMetrics(objName, name, process.hrtime.bigint() - start)
				throw e
			}
		}
	}

export const perfFuncAsync =
	(name: string, objName = '') =>
	<T extends any[], U>(fn: (...args: T) => Promise<U>) => {
		return async (...args: T): Promise<U> => {
			const start = process.hrtime.bigint()
			try {
				const res = await fn(...args)
				addToMetrics(objName, name, process.hrtime.bigint() - start)

				return res
			} catch (e) {
				addToMetrics(objName, name, process.hrtime.bigint() - start)
				throw e
			}
		}
	}

type Fn = (...args: any[]) => any
type AsyncFn = (...args: any[]) => Promise<any>
type Constructor = new (...args: any[]) => any

const isFn = (fn: any): fn is Fn => {
	return typeof fn === 'function'
}

const isAsyncFn = (fn: any): fn is AsyncFn => {
	return isFn(fn) && fn.constructor.name === 'AsyncFunction'
}

export const addPerfToInstance = <T extends object>(name: string, inst: T) => {
	for (const k of Object.getOwnPropertyNames(Object.getPrototypeOf(inst))) {
		const key = k as keyof T & string

		const prop = inst[key] as Fn | AsyncFn
		if (isAsyncFn(prop)) {
			inst[key] = perfFuncAsync(key, name)(prop.bind(inst)) as any
		} else if (isFn(prop)) {
			inst[key] = perfFunc(key, name)(prop.bind(inst)) as any
		}
	}
}

export const addPerfToStatics = <T extends Constructor>(name: string, classObj: T) => {
	for (const k of Object.getOwnPropertyNames(classObj)) {
		const key = k as keyof T & string

		const prop = classObj[key] as Fn | AsyncFn
		if (isAsyncFn(prop)) {
			classObj[key] = perfFuncAsync(key, `${name}:STATIC`)(prop) as any
		} else if (isFn(prop)) {
			classObj[key] = perfFunc(key, `${name}:STATIC`)(prop) as any
		}
	}
}
