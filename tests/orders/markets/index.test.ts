import { Account, zeroAddress } from "viem";
import { app } from "../../../src/routes";
import { markets, TRACKING_CODE } from "../../../src/constants";
import { privateKeyToAccount } from "viem/accounts";
import { hashOfOrder } from "../../../src/signing";
import { OrderType } from "../../../src/types";

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const wallet = privateKeyToAccount(
  "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
);

const addOrder = async (market: string, nonce: number, signer: Account) => {
  const order = {
    nonce,
    accountId: 1n,
    price: 1n,
    amount: 1n,
    limitOrderMaker: true,
    expiration: (Date.now() + 10 * 60 * 1000).toString(),
    trackingCode: TRACKING_CODE,
    relayer: zeroAddress,
  };
  const signature = await signer.sign({
    hash: hashOfOrder({ ...order, marketId: market }, zeroAddress, 1),
  });
  const res = await app.request(`/orders/market/${market}`, {
    method: "POST",
    body: JSON.stringify({
      order,
      user: signer.address,
      signature,
    }),
  });
  const orderRes = await res.json();
  return { order, id: orderRes.orderId, signature };
};

it("Adds an order", async () => {
  const order = {
    nonce: 1,
    accountId: 1n,
    price: 1n,
    amount: 1n,
    limitOrderMaker: true,
    expiration: Date.now() + 10 * 60 * 1000,
    type: OrderType.LIMIT,
    trackingCode: TRACKING_CODE,
    relayer: zeroAddress,
  };
  const marketId = markets[0].id;
  const res = await app.request(`/orders/market/${marketId}`, {
    method: "POST",
    body: JSON.stringify({
      order,
      user: wallet.address,
      signature: await wallet.sign({
        hash: hashOfOrder({ ...order, marketId }, zeroAddress, 1),
      }),
    }),
  });
  expect(res.status).toBe(201);
  const data = await res.json();
  expect(data).toEqual({ success: true, orderId: data.orderId });
});

it("Gets an order", async () => {
  const marketId = markets[0].id;
  // Add order to get
  const { order, id: orderId, signature } = await addOrder(marketId, 1, wallet);

  const res = await app.request(`/orders/market/${marketId}/${orderId}`);
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({
    marketId,
    data: {
      order: {
        ...order,
        accountId: order.accountId.toString(),
        price: order.price.toString(),
        amount: order.amount.toString(),
        expiration: order.expiration.toString(),
        marketId,
      },
      user: wallet.address,
      id: orderId,
      signature,
    },
    orderId,
  });
});

it.skip("Updates an order", async () => {
  const market = "1";
  const { order, id: orderId } = await addOrder(market, 1, wallet);

  const newOrder = structuredClone(order);

  newOrder.amount = 2n;
  newOrder.marketId = market;

  const res = await app.request(`/orders/market/${market}/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({
      order: newOrder,
      signature: wallet.sign({
        hash: hashOfOrder(newOrder, zeroAddress, 1n),
      }),
      user: wallet.address,
    }),
  });

  console.log(await res.json());
  expect(res.status).toBe(200);

  // TODO: Assert order is updated
  expect(await res.json()).toEqual({ success: true });
});

it.skip("Deletes an order", async () => {
  const market = "1";
  const { order, id: orderId } = await addOrder(market, 1, wallet);

  const res = await app.request(`/orders/market/${market}/${orderId}`, {
    method: "DELETE",
    body: JSON.stringify({ signature: "0x" }),
  });
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ success: true });
});
