import { app } from "../../../src/routes";

const addOrder = async (market: string, nonce: number, signature: string) => {
  const res = await app.request(`/orders/market/${market}`, {
    method: "POST",
    body: JSON.stringify({ nonce, signature }),
  });
  const order = await res.json();
  return order.orderId;
};

it.skip("Gets an order", async () => {
  const market = "1";
  const orderId = await addOrder(market, 1, "0x");

  const res = await app.request(`/orders/market/${market}/${orderId}`);
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({
    market,
    data: { nonce: 1, signature: "0x", id: orderId },
    orderId,
  });
});

it.skip("Updates an order", async () => {
  const market = "1";
  const orderId = await addOrder(market, 1, "0x");

  const res = await app.request(`/orders/market/${market}/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({ signature: "0x" }),
  });
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ success: true });
});

it.skip("Deletes an order", async () => {
  const market = "1";
  const orderId = await addOrder(market, 1, "0x");

  const res = await app.request(`/orders/market/${market}/${orderId}`, {
    method: "DELETE",
    body: JSON.stringify({ signature: "0x" }),
  });
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ success: true });
});
