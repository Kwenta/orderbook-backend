import { markets, type Market } from "../constants";

type Hex = `0x${string}`;

type LimitOrder = { id: string; signature: Hex; user: Hex; nonce: number };

const checkOrderSignature = (order: LimitOrder) => {
  // TODO: Implement
  return order.signature.startsWith("0x");
};

const checkDeleteSignature = (orderId: string, signature: Hex) => {
  // TODO: Implement
  return signature.startsWith("0x");
};

const checkUpdateSignature = (order: Partial<LimitOrder> & { signature: Hex }) => {
  // TODO: Implement
  return order.signature.startsWith("0x");
};

const invalidateNonce = async (user: Hex, nonce: number) => {
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
    if (!checkOrderSignature(order)) {
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
    checkUpdateSignature(newOrder);
    const order = this.orders.find((o) => o.id === newOrder.id);
    if (order) {
      Object.assign(order, newOrder);
    }
  }

  async deleteOrder(orderId: string, signature: Hex) {
    checkDeleteSignature(orderId, signature);
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) {
      throw new Error("Order not found");
    }
    await invalidateNonce(order.user, order.nonce);
    delete offersOfUser[order.user][order.id];
    this.orders = this.orders.filter((o) => o.id !== orderId);
  }

  checkForPossibleSettles() {}
}

export const engines = new Map<Market, MatchingEngine>();

for (const market of markets) {
  engines.set(market, new MatchingEngine(market));
}

export const offersOfUser: { [user: string]: { [orderId: string]: Market } } = {};
