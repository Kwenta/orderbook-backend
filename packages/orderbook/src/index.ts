import { serve } from '@hono/node-server'
import { initEmitters } from './engine/events'
import { MatchingEngine } from './engine/matching-engine'
import { Nonce } from './engine/nonce'
import { logger } from './logger'
import { loadMarkets } from './markets'
import { app } from './routes'
import { workers } from './workers'
;(BigInt.prototype as any).toJSON = function () {
	return this.toString()
}

const main = async () => {
	const server = serve(app)
	await new Promise<void>((resolve) => server.on('listening', resolve))
	logger.info('Server listening')

	await loadMarkets()
	logger.info('Markets loaded')

	await initEmitters()
	logger.info('Emitters initialized')

	await MatchingEngine.init(workers.book)
	logger.info('Engines initialized')

	await Nonce.init(workers.nonce)
	logger.info('Nonce manager initialized')
}

main()
