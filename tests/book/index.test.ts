import { app } from "../../src/app";

it("Is able to get the orders on the book", async () => {
  const market = "test-market";

  const res = await app.request(`/book/${market}`);
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ market, orders: [] });
});
