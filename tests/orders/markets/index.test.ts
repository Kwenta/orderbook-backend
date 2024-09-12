import { app } from "../../../src/app";
import { TRACKING_CODE } from "../../../src/constants";

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const addOrder = async (market: string, nonce: number, signature: string) => {
  const res = await app.request(`/orders/market/${market}`, {
    method: "POST",
    body: JSON.stringify({ nonce, signature }),
  });
  const order = await res.json();
  return order.orderId;
};

it("Adds an order", async () => {
  const market = "1";
  const res = await app.request(`/orders/market/${market}`, {
    method: "POST",
    body: JSON.stringify({
      order: {
        nonce: 1,
        accountId: -1n,
        price: 1n,
        amount: 1n,
        limitOrderMaker: true,
        expiration: 1n,
        trackingCode: TRACKING_CODE,
      },
      signature: "0x",
    }),
  });
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ success: true, orderId: "0" });
});

it("Gets an order", async () => {
  const market = "1";
  // Add order to get
  const orderId = await addOrder(market, 1, "0x");

  const res = await app.request(`/orders/market/${market}/${orderId}`);
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({
    market,
    data: { id: orderId, signature: "0x", nonce: 1 },
    orderId,
  });
});

it("Updates an order", async () => {
  const market = "1";
  const orderId = await addOrder(market, 1, "0x");

  const res = await app.request(`/orders/market/${market}/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({ signature: "0x" }),
  });
  expect(res.status).toBe(200);

  // TODO: Assert order is updated
  expect(await res.json()).toEqual({ success: true });
});

it("Deletes an order", async () => {
  const market = "1";
  const orderId = await addOrder(market, 1, "0x");

  const res = await app.request(`/orders/market/${market}/${orderId}`, {
    method: "DELETE",
    body: JSON.stringify({ signature: "0x" }),
  });
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ success: true });
});
