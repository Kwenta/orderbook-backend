import { app } from "../../src/routes";

it("Is able to get the orders on the book", async () => {
  const market = "1";

  const res = await app.request(`/book/${market}`);
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ market, orders: [] });
});
