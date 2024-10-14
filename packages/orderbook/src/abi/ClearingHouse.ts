export const clearingHouseABI = [
	{
		type: 'function',
		name: 'CONDITION_TYPEHASH',
		inputs: [],
		outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'DOMAIN_TYPEHASH',
		inputs: [],
		outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'METADATA_TYPEHASH',
		inputs: [],
		outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'ORDER_TYPEHASH',
		inputs: [],
		outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'TRADER_TYPEHASH',
		inputs: [],
		outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'TRADE_TYPEHASH',
		inputs: [],
		outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'canSettle',
		inputs: [
			{
				name: 'request',
				type: 'tuple',
				internalType: 'struct IClearinghouse.Request',
				components: [
					{
						name: 'orders',
						type: 'tuple[]',
						internalType: 'struct IClearinghouse.Order[]',
						components: [
							{
								name: 'metadata',
								type: 'tuple',
								internalType: 'struct IClearinghouse.Metadata',
								components: [
									{ name: 'genesis', type: 'uint256', internalType: 'uint256' },
									{ name: 'expiration', type: 'uint256', internalType: 'uint256' },
									{ name: 'trackingCode', type: 'bytes32', internalType: 'bytes32' },
									{ name: 'referrer', type: 'address', internalType: 'address' },
								],
							},
							{
								name: 'trader',
								type: 'tuple',
								internalType: 'struct IClearinghouse.Trader',
								components: [
									{ name: 'nonce', type: 'uint256', internalType: 'uint256' },
									{ name: 'accountId', type: 'uint128', internalType: 'uint128' },
									{ name: 'signer', type: 'address', internalType: 'address' },
								],
							},
							{
								name: 'trade',
								type: 'tuple',
								internalType: 'struct IClearinghouse.Trade',
								components: [
									{ name: 't', type: 'uint8', internalType: 'enum IClearinghouse.Type' },
									{ name: 'marketId', type: 'uint128', internalType: 'uint128' },
									{ name: 'size', type: 'int128', internalType: 'int128' },
									{ name: 'price', type: 'uint256', internalType: 'uint256' },
								],
							},
							{
								name: 'conditions',
								type: 'tuple[]',
								internalType: 'struct IClearinghouse.Condition[]',
								components: [
									{ name: 'target', type: 'address', internalType: 'address' },
									{ name: 'selector', type: 'bytes4', internalType: 'bytes4' },
									{ name: 'data', type: 'bytes', internalType: 'bytes' },
									{ name: 'expected', type: 'bytes32', internalType: 'bytes32' },
								],
							},
						],
					},
					{ name: 'signatures', type: 'bytes[]', internalType: 'bytes[]' },
				],
			},
		],
		outputs: [
			{
				name: '',
				type: 'tuple',
				internalType: 'struct IClearinghouse.Response',
				components: [
					{ name: 'success', type: 'bool', internalType: 'bool' },
					{ name: 'data', type: 'bytes', internalType: 'bytes' },
				],
			},
		],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'hash',
		inputs: [
			{
				name: 'order',
				type: 'tuple',
				internalType: 'struct IClearinghouse.Order',
				components: [
					{
						name: 'metadata',
						type: 'tuple',
						internalType: 'struct IClearinghouse.Metadata',
						components: [
							{ name: 'genesis', type: 'uint256', internalType: 'uint256' },
							{ name: 'expiration', type: 'uint256', internalType: 'uint256' },
							{ name: 'trackingCode', type: 'bytes32', internalType: 'bytes32' },
							{ name: 'referrer', type: 'address', internalType: 'address' },
						],
					},
					{
						name: 'trader',
						type: 'tuple',
						internalType: 'struct IClearinghouse.Trader',
						components: [
							{ name: 'nonce', type: 'uint256', internalType: 'uint256' },
							{ name: 'accountId', type: 'uint128', internalType: 'uint128' },
							{ name: 'signer', type: 'address', internalType: 'address' },
						],
					},
					{
						name: 'trade',
						type: 'tuple',
						internalType: 'struct IClearinghouse.Trade',
						components: [
							{ name: 't', type: 'uint8', internalType: 'enum IClearinghouse.Type' },
							{ name: 'marketId', type: 'uint128', internalType: 'uint128' },
							{ name: 'size', type: 'int128', internalType: 'int128' },
							{ name: 'price', type: 'uint256', internalType: 'uint256' },
						],
					},
					{
						name: 'conditions',
						type: 'tuple[]',
						internalType: 'struct IClearinghouse.Condition[]',
						components: [
							{ name: 'target', type: 'address', internalType: 'address' },
							{ name: 'selector', type: 'bytes4', internalType: 'bytes4' },
							{ name: 'data', type: 'bytes', internalType: 'bytes' },
							{ name: 'expected', type: 'bytes32', internalType: 'bytes32' },
						],
					},
				],
			},
		],
		outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'name',
		inputs: [],
		outputs: [{ name: '', type: 'string', internalType: 'string' }],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'settle',
		inputs: [
			{
				name: 'request',
				type: 'tuple',
				internalType: 'struct IClearinghouse.Request',
				components: [
					{
						name: 'orders',
						type: 'tuple[]',
						internalType: 'struct IClearinghouse.Order[]',
						components: [
							{
								name: 'metadata',
								type: 'tuple',
								internalType: 'struct IClearinghouse.Metadata',
								components: [
									{ name: 'genesis', type: 'uint256', internalType: 'uint256' },
									{ name: 'expiration', type: 'uint256', internalType: 'uint256' },
									{ name: 'trackingCode', type: 'bytes32', internalType: 'bytes32' },
									{ name: 'referrer', type: 'address', internalType: 'address' },
								],
							},
							{
								name: 'trader',
								type: 'tuple',
								internalType: 'struct IClearinghouse.Trader',
								components: [
									{ name: 'nonce', type: 'uint256', internalType: 'uint256' },
									{ name: 'accountId', type: 'uint128', internalType: 'uint128' },
									{ name: 'signer', type: 'address', internalType: 'address' },
								],
							},
							{
								name: 'trade',
								type: 'tuple',
								internalType: 'struct IClearinghouse.Trade',
								components: [
									{ name: 't', type: 'uint8', internalType: 'enum IClearinghouse.Type' },
									{ name: 'marketId', type: 'uint128', internalType: 'uint128' },
									{ name: 'size', type: 'int128', internalType: 'int128' },
									{ name: 'price', type: 'uint256', internalType: 'uint256' },
								],
							},
							{
								name: 'conditions',
								type: 'tuple[]',
								internalType: 'struct IClearinghouse.Condition[]',
								components: [
									{ name: 'target', type: 'address', internalType: 'address' },
									{ name: 'selector', type: 'bytes4', internalType: 'bytes4' },
									{ name: 'data', type: 'bytes', internalType: 'bytes' },
									{ name: 'expected', type: 'bytes32', internalType: 'bytes32' },
								],
							},
						],
					},
					{ name: 'signatures', type: 'bytes[]', internalType: 'bytes[]' },
				],
			},
		],
		outputs: [
			{
				name: '',
				type: 'tuple',
				internalType: 'struct IClearinghouse.Response',
				components: [
					{ name: 'success', type: 'bool', internalType: 'bool' },
					{ name: 'data', type: 'bytes', internalType: 'bytes' },
				],
			},
		],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'version',
		inputs: [],
		outputs: [{ name: '', type: 'string', internalType: 'string' }],
		stateMutability: 'view',
	},
] as const
