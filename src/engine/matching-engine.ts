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

const invalidateNonce = async (user: Hex, nonce: number) => {
  // TODO: Implement
};

export class MatchingEngine {
  orders: LimitOrder[];

  constructor() {
    this.orders = [];
  }

  async addOrder(order: LimitOrder) {
    if (!checkOrderSignature(order)) {
      throw new Error("Invalid order signature");
    }
    this.orders.push(order);
    this.checkForPossibleSettles();
  }

  getOrders() {
    return this.orders;
  }

  getOrdersOfUser(user: `0x${string}`) {
    return this.orders.filter((o) => o.user === user);
  }

  async updateOrder(newOrder: Partial<LimitOrder>) {
    const order = this.orders.find((o) => o.id === newOrder.id);
    if (order) {
      Object.assign(order, newOrder);
    }
  }

  async deleteOrder(orderId: string, signature: `0x${string}`) {
    checkDeleteSignature(orderId, signature);
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) {
      throw new Error("Order not found");
    }
    await invalidateNonce(order.user, order.nonce);
    this.orders = this.orders.filter((o) => o.id !== orderId);
  }

  checkForPossibleSettles() {}
}
