import { serve } from '@hono/node-server'
import { initEmitters } from './engine/events'
import { init } from './engine/matching-engine'
import { app } from './routes'
;(BigInt.prototype as any).toJSON = function () {
	return this.toString()
}

initEmitters().then(() => init())

const _server = serve(app)

// TODO: Add logging and generic error handling
