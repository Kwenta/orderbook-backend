import { testClient } from "hono/testing";
import app from "../src/index";

it("test", async () => {
  const res = await app.request("/");
  expect(res.status).toBe(200);
  expect(await res.text()).toBe("Hello Hono!");
});
