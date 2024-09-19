import { markets } from "../../src/constants";
import { app } from "../../src/routes";

it("Is able to get the orders on the book", async () => {
  const marketId = markets[0].id;

  const res = await app.request(`/book/${marketId}`);
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ marketId, orders: [] });
});
