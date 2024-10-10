import { logger } from './logger'

const perfMetrics: {
	[className: string]: { [methodName: string]: { count: bigint; total: bigint } }
} = {}

const scale = {
	m: BigInt(6e10),
	s: BigInt(1e9),
	ms: BigInt(1e6),
	μs: BigInt(1e3),
	ns: BigInt(1),
} as const

export const formatTime = (time: bigint) => {
	let num = time
	let res = ''

	const inc1 = num / scale.m
	num -= inc1 * scale.m
	const m = inc1.toString().padStart(2, '0')
	res += `${m}m `

	const inc2 = num / scale.s
	num -= inc2 * scale.s
	res += `${inc2.toString().padStart(2, '0')}s `

	for (const uom in scale) {
		if (uom === 'm') continue
		if (uom === 's') continue
		const step = scale[uom]
		const inc = num / step
		num -= inc * step
		res += `${(step < scale.s ? inc.toString().padStart(3, '0') : inc) + uom} `
	}

	return res.trim()
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

setInterval(printMetrics, 30000)

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

const isFn = (fn: any): fn is Fn => {
	return typeof fn === 'function'
}

const isAsyncFn = (fn: any): fn is AsyncFn => {
	return isFn(fn) && fn.constructor.name === 'AsyncFunction'
}

export const addPerfToInstance = <T extends Record<string, Fn | AsyncFn>>(
	name: string,
	inst: T
) => {
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
