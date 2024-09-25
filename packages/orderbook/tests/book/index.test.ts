import { markets } from '../../src/constants'
import { app } from '../../src/routes'

it('Is able to get the orders on the book', async () => {
	const marketId = markets[0].id

	const res = await app.request(`/book/${marketId}`)
	const data = await res.json()
	expect(res.status).toBe(200)
	expect(data).toEqual({ marketId, orders: [] })
})
