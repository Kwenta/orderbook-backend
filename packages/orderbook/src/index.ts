import { serve } from '@hono/node-server'
import { init } from './engine/matching-engine'
import { app } from './routes'
;(BigInt.prototype as any).toJSON = function () {
	return this.toString()
}

init()

const _server = serve(app)
