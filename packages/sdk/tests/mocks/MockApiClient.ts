import { vitest } from 'vitest'

export class MockApiClient {
	markets = {
		$get: vitest.fn().mockResolvedValue({
			json: () =>
				Promise.resolve([
					{ id: '1', name: 'Market 1' },
					{ id: '2', name: 'Market 2' },
				]),
		}),
	}

	orders = {
		':marketId': {
			$post: vitest.fn().mockResolvedValue({
				json: () => Promise.resolve({ id: 'order1', status: 'created' }),
			}),
		},
	}
}
