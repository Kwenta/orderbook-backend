import { serve } from '@hono/node-server'
import { app } from './routes'
;(BigInt.prototype as any).toJSON = function () {
	return this.toString()
}

const _server = serve(app)
