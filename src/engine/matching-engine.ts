import type { int128, Order } from "../types";
import { markets } from "../constants";
import { checkSignatureOfOrder } from "../signing";
import type { Market, MarketId } from "../types";
import { zeroAddress } from "viem";
import { randomBytes } from "node:crypto";
import { HTTPError } from "../utils";

type Hex = `0x${string}`;

type LimitOrder = LimitOrderRaw & { id: string; timestamp?: bigint };

type LimitOrderRaw = { signature: Hex; user: Hex; order: Order };

const side = (order: Order) => (order.trade.size < BigInt(0) ? "sell" : "buy");

const checkOrderSignature = async (order: LimitOrder) => {
  return checkSignatureOfOrder(order.order, zeroAddress, BigInt(1), order.user, order.signature);
};

const checkDeleteSignature = async (lo: LimitOrder) => {
  const newOrder = structuredClone(lo);
  newOrder.order.trade.size = BigInt(0) as int128;
  return await checkOrderSignature(newOrder);
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

  async addOrder(orderData: LimitOrderRaw) {
    const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));
    if (orderData.order.metadata.expiration <= currentTimestamp) {
      throw new Error("Order has expired");
    }

    const orderWithId: LimitOrder = {
      ...orderData,
      id: randomBytes(16).toString("hex"),
      timestamp: currentTimestamp,
    };

    const { order, id } = orderWithId;
    const price = order.trade.price;

    if (!(await checkOrderSignature(orderWithId))) {
      throw new Error("Invalid order signature");
    }

    const orderMap = side(order) === "buy" ? this.buyOrders : this.sellOrders;
    if (!orderMap.has(price)) {
      orderMap.set(price, new Map());
    }

    orderMap.get(price)?.set(id, orderWithId);
    this.orderIdToPrice.set(id, price);

    await this.checkForPossibleSettles();
    return id;
  }

  getOrders(type: "buy" | "sell" | "all" = "all", price?: bigint): LimitOrder[] {
    const getOrdersFromMap = (map: Map<bigint, Map<string, LimitOrder>>) => {
      if (price !== undefined) {
        return Array.from(map.get(price)?.values() ?? []);
      }
      return Array.from(map.values()).flatMap((priceMap) => Array.from(priceMap.values()));
    };

    switch (type) {
      case "buy":
        return getOrdersFromMap(this.buyOrders);
      case "sell":
        return getOrdersFromMap(this.sellOrders);
      case "all":
        return [...getOrdersFromMap(this.buyOrders), ...getOrdersFromMap(this.sellOrders)];
    }
  }

  getOrder(orderId: string) {
    const price = this.orderIdToPrice.get(orderId);
    if (price === undefined) return undefined;

    return this.buyOrders.get(price)?.get(orderId) || this.sellOrders.get(price)?.get(orderId);
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

    await checkDeleteSignature({ ...order, signature });

    const price = this.orderIdToPrice.get(orderId);
    if (!price) throw new Error("Price not found");
    const orderMap = side(order) === "buy" ? this.buyOrders : this.sellOrders;
    orderMap.get(price)?.delete(orderId);
    if (orderMap.get(price)?.size === 0) {
      orderMap.delete(price);
    }
    this.orderIdToPrice.delete(orderId);
  }

  pruneBook() {
    const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));
    for (const [price, buyOrdersMap] of this.buyOrders) {
      for (const [orderId, { order, signature }] of buyOrdersMap) {
        if (order.metadata.expiration <= currentTimestamp) {
          this.deleteOrder(orderId, signature);
        }
      }
    }

    for (const [price, sellOrdersMap] of this.sellOrders) {
      for (const [orderId, { order, signature }] of sellOrdersMap) {
        if (order.metadata.expiration <= currentTimestamp) {
          this.deleteOrder(orderId, signature);
        }
      }
    }
  }

  checkForPossibleSettles() {
    const matchingOrders: LimitOrder[] = [];

    for (const [price, buyOrdersMap] of this.buyOrders) {
      console.log(`Checking for possible settles at price ${price}`);
      const sellOrdersMap = this.sellOrders.get(price);

      if (sellOrdersMap) {
        console.log(`Sell orders: ${sellOrdersMap?.size}`);
        matchingOrders.push(...buyOrdersMap.values());
        matchingOrders.push(...sellOrdersMap.values());
      }
    }

    // TODO: Decide how we order the matching
    console.log({ matchingOrders });

    // Pair up orders, then recheck for settles
    return matchingOrders;
  }
}

export const engines = new Map<MarketId, MatchingEngine>();

for (const market of markets) {
  engines.set(market.id.toLowerCase() as MarketId, new MatchingEngine(market));
}

export const findEngineOrFail = (marketId?: MarketId) => {
  if (!marketId) throw new HTTPError(400, "The market was not provided");

  const engine = engines.get(marketId.toLowerCase() as MarketId);
  if (!engine) throw new HTTPError(404, "The market was not found");

  return engine;
};
