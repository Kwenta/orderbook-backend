import { testClient } from "hono/testing";
import app from "../../src/index";

it("test", async () => {
  const market = "test-market";

  const res = await app.request(`/book/${market}`);
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ market });
});
