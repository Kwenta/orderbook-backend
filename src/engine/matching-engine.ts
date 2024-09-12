import { Order } from "schemas";
import { markets, type Market } from "../constants";
import { checkSignatureOfOrder } from "signing";

type Hex = `0x${string}`;

type LimitOrder = { id?: string; signature: Hex; user: Hex; order: Order };

const checkOrderSignature = async (order: LimitOrder) => {
  return checkSignatureOfOrder(
    order.order,
    "0x",
    -1n,
    order.user,
    order.signature
  );
};

const checkDeleteSignature = (lo: LimitOrder) => {
  const newOrder = structuredClone(lo);
  newOrder.order.amount = 0n;
  return checkOrderSignature(newOrder);
};

const checkUpdateSignature = (
  order: Partial<LimitOrder> & { signature: Hex }
) => {
  // TODO: Implement
  return order.signature.startsWith("0x");
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

  async updateOrder(newOrder: Partial<LimitOrder> & { signature: Hex }) {
    await checkUpdateSignature(newOrder);
    const order = this.orders.find((o) => o.id === newOrder.id);
    if (order) {
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
    delete offersOfUser[order.user][order.id];
    this.orders = this.orders.filter((o) => o.id !== orderId);
  }

  checkForPossibleSettles() {}
}

export const engines = new Map<Market, MatchingEngine>();

for (const market of markets) {
  engines.set(market, new MatchingEngine(market));
}

export const offersOfUser: { [user: string]: { [orderId: string]: Market } } =
  {};
