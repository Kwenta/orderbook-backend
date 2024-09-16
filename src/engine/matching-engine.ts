import type { Order } from "schemas";
import { markets } from "../constants";
import { checkSignatureOfOrder } from "../signing";
import type { Market } from "../types";
import { zeroAddress } from "viem";
import { randomBytes } from "node:crypto";

type Hex = `0x${string}`;

type LimitOrder = { id: string; signature: Hex; user: Hex; order: Order; timestamp: bigint };

type LimitOrderRaw = { signature: Hex; user: Hex; order: Order };

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

  async addOrder(order: LimitOrderRaw) {
    const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));
    if (order.order.expiration <= currentTimestamp) {
      throw new Error("Order has expired");
    }

    const orderWithId: LimitOrder = { ...order, id: randomBytes(16).toString('hex'), timestamp: currentTimestamp };

    if (!(await checkOrderSignature(orderWithId))) {
      throw new Error("Invalid order signature");
    }

    const orderMap = order.order.limitOrderMaker ? this.buyOrders : this.sellOrders;
    if (!orderMap.has(orderWithId.order.price)) {
      orderMap.set(orderWithId.order.price, new Map());
    }

    orderMap.get(orderWithId.order.price)?.set(orderWithId.id, orderWithId);
    this.orderIdToPrice.set(orderWithId.id, orderWithId.order.price);

    await this.checkForPossibleSettles();
    return orderWithId.id;
  }

  getOrders(type: 'buy' | 'sell' | 'all' = 'all', price?: bigint): LimitOrder[] {
    const getOrdersFromMap = (map: Map<bigint, Map<string, LimitOrder>>) => {
      if (price !== undefined) {
        return Array.from(map.get(price)?.values() ?? []);
      }
      return Array.from(map.values()).flatMap(priceMap => Array.from(priceMap.values()));
    };

    switch (type) {
      case 'buy':
        return getOrdersFromMap(this.buyOrders);
      case 'sell':
        return getOrdersFromMap(this.sellOrders);
      case 'all':
        return [
          ...getOrdersFromMap(this.buyOrders),
          ...getOrdersFromMap(this.sellOrders)
        ];
    }
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
