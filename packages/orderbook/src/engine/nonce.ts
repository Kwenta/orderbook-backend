import { uint256 } from 'schemas/solidity'
import type { AccountId, uint } from '../types'

const nonces = new Map<AccountId, { nonce: uint['256']; lastSeen: Date }>()

export const nonceOfUser = (user: AccountId) => {
	return nonces.get(user) ?? { nonce: 0n, lastSeen: new Date() }
}

export const getAndIncrementNonce = (user: AccountId) => {
	const nonce = nonceOfUser(user)
	nonces.set(user, { nonce: uint256().parse(nonce.nonce + 1n), lastSeen: new Date() })
	return nonce
}

export const incrementNonce = (user: AccountId) => {
	const nonce = nonceOfUser(user)
	nonces.set(user, { nonce: uint256().parse(nonce.nonce + 1n), lastSeen: nonce.lastSeen })
}
