import { testClient } from "hono/testing";
import app from "../../../src/index";

it("Adds an order", async () => {
  const market = "test-market";
  const res = await app.request(`/orders/${market}`, { method: "POST", body: JSON.stringify({}) });
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ success: true });
});

it("Gets an order", async () => {
  const market = "test-market";
  const orderId = 1;
  const res = await app.request(`/orders/${market}/${orderId}`);
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ market, data: {}, orderId });
});

it("Updates an order", async () => {
  const market = "test-market";
  const orderId = 1;

  const res = await app.request(`/orders/${market}/${orderId}`, { method: "PATCH", body: JSON.stringify({}) });
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ success: true });
});

it("Deletes an order", async () => {
  const market = "test-market";
  const orderId = 1;
  const res = await app.request(`/orders/${market}/${orderId}`, { method: "DELETE" });
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ success: true });
});
