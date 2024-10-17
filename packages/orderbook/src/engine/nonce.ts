import type { Worker } from 'node:worker_threads'
import { INTERVALS } from '../constants'
import { logger } from '../logger'
import { addPerfToInstance, addPerfToStatics } from '../monitoring'
import { uint256 } from '../schemas/solidity'
import type { AccountId, uint } from '../types'

type DBNonce = {
	account_id: AccountId
	nonce: string
	last_seen: string
}

/**
 * Class for tracking the nonce of all users on the orderbook system
 */
export class Nonce {
	static get(user: AccountId) {
		return Nonce.nonces.get(user) ?? new Nonce(user)
	}

	static nonces = new Map<AccountId, Nonce>()
	static worker?: Worker

	static persist() {
		// TODO: Need to manage only the nonces that have changed
		if (Nonce.nonces.size !== 0) {
			const nonces = Array.from(Nonce.nonces.values())
			Nonce.worker?.postMessage(JSON.stringify({ type: 'nonce', data: { nonces } }))
		}
		setTimeout(Nonce.persist, INTERVALS.PERSIST_NONCES)
	}

	static async initNoncesFromDB() {
		Nonce.worker?.postMessage(JSON.stringify({ type: 'load_nonces', data: {} }))
		const nonces = await new Promise<DBNonce[]>((resolve) => {
			const resolveWhenBook = (message: string) => {
				const data = JSON.parse(message)

				if (data.type === 'nonce_init') {
					Nonce.worker?.off('message', resolveWhenBook)
					resolve(data.nonces)
				}
			}
			Nonce.worker?.on('message', resolveWhenBook)
		})

		logger.debug(`Loaded ${nonces.length} nonces`)

		for (const nonce of nonces) {
			Nonce.nonces.set(
				nonce.account_id,
				new Nonce(nonce.account_id, uint256().parse(nonce.nonce), new Date(nonce.last_seen))
			)
		}
	}

	static async init(worker: Worker) {
		Nonce.worker = worker
		await Nonce.initNoncesFromDB()
		Nonce.persist()
		addPerfToStatics('Nonce', Nonce)
	}

	constructor(
		public readonly user: AccountId,
		public nonce: uint['256'] = uint256().parse(0n),
		public lastSeen: Date = new Date()
	) {
		Nonce.nonces.set(user, this)
		addPerfToInstance('Nonce', this)
	}

	increment() {
		this.nonce = uint256().parse(this.nonce + 1n)
		this.lastSeen = new Date()
	}
}
