import { Order } from "schemas";
import { markets } from "../constants";
import { checkSignatureOfOrder } from "../signing";
import { Market } from "../types";
import { zeroAddress } from "viem";

type Hex = `0x${string}`;

type LimitOrder = { id?: string; signature: Hex; user: Hex; order: Order };

const checkOrderSignature = async (order: LimitOrder) => {
  return checkSignatureOfOrder(
    order.order,
    zeroAddress,
    BigInt(1),
    order.user,
    order.signature
  );
};

const checkDeleteSignature = async (lo: LimitOrder) => {
  const newOrder = structuredClone(lo);
  newOrder.order.amount = BigInt(0);
  return await checkOrderSignature(newOrder);
};

const invalidateNonce = async (user: Hex, nonce: bigint) => {
  // TODO: Implement
};

let orderId = 0;

export class MatchingEngine {
  orders: LimitOrder[];

  constructor(public readonly market: Market) {
    this.orders = [];
  }

  async addOrder(order: LimitOrder) {
    order.id = `${orderId++}`;
    if (!(await checkOrderSignature(order))) {
      throw new Error("Invalid order signature");
    }
    offersOfUser[order.user] = offersOfUser[order.user] || {};
    offersOfUser[order.user][order.id] = this.market;
    this.orders.push(order);
    this.checkForPossibleSettles();
    return order.id;
  }

  getOrders() {
    return this.orders;
  }

  getOrder(orderId: string) {
    return this.orders.find((o) => o.id === orderId);
  }

  getOrdersOfUser(user: Hex) {
    return this.orders.filter((o) => o.user === user);
  }

  async updateOrder(newOrder: LimitOrder & { id: string }) {
    await checkOrderSignature(newOrder);
    const order = this.orders.find((o) => o.id === newOrder.id);
    if (order) {
      const allPropsSame = Object.keys(order).every(
        (k) => order[k as keyof LimitOrder] === newOrder[k as keyof LimitOrder]
      );
      if (allPropsSame) {
        throw new Error("Order not changed");
      }
      Object.assign(order, newOrder);
    }
  }

  async deleteOrder(orderId: string, signature: Hex) {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) {
      throw new Error("Order not found");
    }
    await checkDeleteSignature(order);
    await invalidateNonce(order.user, order.order.nonce);
    if (order.id) {
      delete offersOfUser[order.user][order.id];
    }
    this.orders = this.orders.filter((o) => o.id !== orderId);
  }

  checkForPossibleSettles() {
    const pricesWithMultipleOrders = new Map<bigint, LimitOrder[]>();

    for (const order of this.orders) {
      const orders = pricesWithMultipleOrders.get(order.order.price) || [];
      orders.push(order);
      pricesWithMultipleOrders.set(order.order.price, orders);
    }

    for (const price of pricesWithMultipleOrders.keys()) {
      const orders = pricesWithMultipleOrders.get(price);

      // Remove prices with one order
      if (orders.length < 2) {
        pricesWithMultipleOrders.delete(price);
      }

      // Remove prices with only one side of the book
      if (
        orders?.every((o) => o.order.limitOrderMaker) ||
        orders?.every((o) => !o.order.limitOrderMaker)
      ) {
        pricesWithMultipleOrders.delete(price);
      }

      // Pair up orders, then recheck for settles
    }
  }
}

export const engines = new Map<Market, MatchingEngine>();

for (const market of markets) {
  engines.set(market, new MatchingEngine(market));
}

export const offersOfUser: { [user: string]: { [orderId: string]: Market } } =
  {};
