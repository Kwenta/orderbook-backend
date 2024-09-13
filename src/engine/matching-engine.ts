import { Order } from "schemas";
import { markets } from "../constants";
import { checkSignatureOfOrder } from "../signing";
import { Market } from "../types";
import { zeroAddress } from "viem";
import { randomBytes } from "node:crypto";

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

export class MatchingEngine {
  private buyOrders: Map<bigint, Map<string, LimitOrder>>;
  private sellOrders: Map<bigint, Map<string, LimitOrder>>;
  private orderIdToPrice: Map<string, bigint>;

  constructor(public readonly market: Market) {
    this.buyOrders = new Map();
    this.sellOrders = new Map();
    this.orderIdToPrice = new Map();
  }

  async addOrder(order: LimitOrder) {
    if (!order.id) {
      order.id = randomBytes(16).toString('hex');
    }

    if (!(await checkOrderSignature(order))) {
      throw new Error("Invalid order signature");
    }

    const orderMap = order.order.limitOrderMaker ? this.buyOrders : this.sellOrders;
    if (!orderMap.has(order.order.price)) {
      orderMap.set(order.order.price, new Map());
    }
    orderMap.get(order.order.price)!.set(order.id, order);
    this.orderIdToPrice.set(order.id, order.order.price);

    this.checkForPossibleSettles();
    return order.id;
  }

  getOrders() {
    return [...this.buyOrders.values(), ...this.sellOrders.values()];
  }

  getOrder(orderId: string) {
    const price = this.orderIdToPrice.get(orderId);
    if (price === undefined) return undefined;

    return this.buyOrders.get(price)?.get(orderId) ||
           this.sellOrders.get(price)?.get(orderId);
  }

  getOrdersOfUser(user: Hex) {
    // Outside from matching engine.
  }

  async updateOrder(newOrder: LimitOrder & { id: string }) {
    await checkOrderSignature(newOrder);

    // Just remove from memory, not onchain
    this.deleteOrder(newOrder.id, newOrder.signature);

    this.addOrder(newOrder);
  }

  async deleteOrder(orderId: string, signature: Hex) {
    const order = this.getOrder(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    await checkDeleteSignature(order);
    await invalidateNonce(order.user, order.order.nonce);

    const price = this.orderIdToPrice.get(orderId)!;
    const orderMap = order.order.limitOrderMaker ? this.buyOrders : this.sellOrders;
    orderMap.get(price)?.delete(orderId);
    if (orderMap.get(price)?.size === 0) {
      orderMap.delete(price);
    }
    this.orderIdToPrice.delete(orderId);
  }

  checkForPossibleSettles() {
    const matchingOrders: LimitOrder[] = [];

    for (const [price, buyOrdersMap] of this.buyOrders) {
      const sellOrdersMap = this.sellOrders.get(price);

      if (sellOrdersMap) {
        matchingOrders.push(...buyOrdersMap.values());
        matchingOrders.push(...sellOrdersMap.values());
      }
    }

    // Pair up orders, then recheck for settles
    return matchingOrders;
  }
}

export const engines = new Map<Market, MatchingEngine>();

for (const market of markets) {
  engines.set(market, new MatchingEngine(market));
}

export const offersOfUser: { [user: string]: { [orderId: string]: Market } } =
  {};
