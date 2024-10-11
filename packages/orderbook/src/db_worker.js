const { parentPort, workerData } = require('node:worker_threads')
const { Logger } = require('tslog')

const {config}= require( 'dotenv')
config()

const pg = require( 'pg')

const cols = {
	black: 30,
	red: 31,
	green: 32,
	yellow: 33,
	blue: 34,
	magenta: 35,
	cyan: 36,
	white: 37,
}

const ansiColorWrap = (val, code) => `\u001b[${cols[code]}m${val}\u001b[0m`

const levels = {
	INFO: 'blue',
	DEBUG: 'magenta',
	ERROR: 'red',
	WARN: 'yellow',
}

const workerLogger = new Logger({
	name: 'orderbook-worker',
	minLevel: 'silly',
	overwrite: {
		formatMeta: (meta) => {
			if (!meta) return ''
			const { date, logLevelName, path, name } = meta
			const location = ` WORKER-${workerData.name}:${path?.fileLine}:${path?.fileColumn}`
			const level = logLevelName

			const colour = levels[level] ?? levels.INFO
			return `${date.toISOString()} {${name}} ${`[${ansiColorWrap(logLevelName, colour)}]`.padEnd(20, ' ')} ${location.padEnd(50, ' ')} `
		},
		transportJSON: (msg) => {
			parentPort?.postMessage(JSON.stringify({ type: 'log', message: msg }))
		},
	},
})

const main = async () => {
	const pool = new pg.Pool({
		database: process.env.DB_NAME,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		host: process.env.DB_HOST,
		port: parseInt(process.env.DB_PORT),
		ssl: true,
	})

	await pool.connect()

	workerLogger.info('Connected to database')
	await pool.query(
		'CREATE TABLE IF NOT EXISTS books (market_id integer PRIMARY KEY, book JSONB, timestamp TIMESTAMP)'
	)
	await pool.query(
		'CREATE TABLE IF NOT EXISTS nonces (account_id text PRIMARY KEY, nonce integer, last_seen TIMESTAMP)'
	)

	parentPort?.on('message', async (message) => {
		/**
		 * @type {{ type: 'book', data: {marketId: string, orders: any[]} }}
		 */
		const data = JSON.parse(message)

		switch (data.type) {
			case 'book': {
				const { marketId, orders } = data.data

				await pool.query(
					'INSERT INTO books (market_id, book, timestamp) VALUES ($1, $2, $3) ON CONFLICT (market_id) DO UPDATE SET book = EXCLUDED.book, timestamp = EXCLUDED.timestamp',
					[marketId, JSON.stringify(orders), new Date()]
				)
				// workerLogger.info(`Got book for market ${marketId} with ${orders.length} orders`)
				break
			}
			case 'nonce': {
				const { nonces } = data.data
				if (nonces.length === 0) {
					workerLogger.warn('Got no nonces')
					break
				}
				workerLogger.debug(`Got nonces for ${nonces.length} accounts`)
				await pool.query('BEGIN')
				for (const nonce of nonces) {
					await pool.query(
						`INSERT INTO nonces (account_id, nonce, last_seen) VALUES ($1, $2, $3) ON CONFLICT (account_id) DO UPDATE SET nonce = EXCLUDED.nonce, last_seen = EXCLUDED.last_seen`,
						[nonce.user, nonce.nonce, nonce.lastSeen]
					)
				}
				await pool.query('COMMIT')

				break
			}
			case 'load_book': {
				const { marketId } = data.data
				const { rows } = await pool.query('SELECT * FROM books WHERE market_id = $1', [marketId])
				const orders = rows[0]?.book ?? []
				parentPort?.postMessage(JSON.stringify({ type: 'book_init', book: { orders } }))
				break
			}
			case 'load_nonces': {
				const { rows } = await pool.query('SELECT * FROM nonces')
				parentPort?.postMessage(JSON.stringify({ type: 'nonce_init', nonces: rows }))
				break
			}
			default:
				throw new Error(`Unknown message type: ${data.type}`)
		}
	})
}

main()
