import { uint256 } from 'schemas/solidity'
import type { Address } from 'viem'
import type { uint } from '../types'

const nonces = new Map<Address, { nonce: uint['256']; lastSeen: Date }>()

export const nonceOfUser = (user: Address) => {
	return nonces.get(user) ?? { nonce: 0n, lastSeen: new Date() }
}

export const getAndIncrementNonce = (user: Address) => {
	const nonce = nonceOfUser(user)
	nonces.set(user, { nonce: uint256().parse(nonce.nonce + 1n), lastSeen: new Date() })
	return nonce
}

export const incrementNonce = (user: Address) => {
	const nonce = nonceOfUser(user)
	nonces.set(user, { nonce: uint256().parse(nonce.nonce + 1n), lastSeen: nonce.lastSeen })
}
