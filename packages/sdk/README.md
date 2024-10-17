# Orderbook SDK

The Orderbook SDK is a TypeScript library for interacting with the Synthetix V3 Orderbook. It provides a simple interface to manage orders and retrieve market information.

## Installation

To install the Orderbook SDK, run the following command:

```bash
npm install orderbook-sdk
```

## Dependencies

This SDK has the following dependencies:

- `viem`: ^2.21.6

Make sure to install these dependencies in your project.

## Usage
Here's a basic example of how to use the Orderbook SDK:

```typescript
import { OrderbookSDK, OrderType } from 'orderbook-sdk';

// Initialize the SDK
const sdk = new OrderbookSDK('https://api.example.com', 'https://rpc.example.com', {
  address: walletClient.account.address, // or any other address
  signTypedData: walletClient.signTypedData, // or signTypedDataAsync from wagmi
});

// Get markets
const markets = await sdk.getMarkets();

// Create an order
const marketId = 200n; // BTC / USD
const orderType = OrderType.LIMIT;
const size = parseUnits('1', 18); // 1 BTC
const price = parseUnits('100000', 18); // 100,000 USD
const { id } = await sdk.createOrder(marketId, orderType, size, price);

const orders = await sdk.getOrders(marketId); // Get all orders for the market
const order = await sdk.getOrder(marketId, id); // Get a specific order
```

## API Documentation

### Class: OrderbookSDK

#### Constructor

```typescript
constructor(apiUrl: string, rpcUrl?: string, account?: SDKAccount)
```

- `apiUrl`: The URL of the Orderbook API
- `rpcUrl`: (Optional) The URL of the RPC endpoint
- `account`: (Optional) An object containing the user's address and a method to sign typed data

#### Methods
- `getMarkets()`: Promise<{ id: bigint; symbol: string }[]>
  - Retrieves a list of available markets.
- `getMarket(id: bigint)`: Promise<{ id: bigint; symbol: string }>
  - Retrieves information about a specific market.
getOrders(marketId: bigint): Promise<{ id: string; order: Order }[]>
  - Retrieves a list of orders for a specific market.
- `getOrder(marketId: bigint, orderId: string)`: Promise<{ id: string; order: Order }>
  - Retrieves information about a specific order.
- `createOrder(marketId: bigint, t: OrderType, size: bigint, price: bigint)`: Promise<any>
  - Creates a new order.
- `editOrder(marketId: bigint, orderId: string, newOrder: { orderType: OrderType; size: bigint; price: bigint })`: Promise<any>
  - Modifies an existing order.
- `deleteOrder(marketId: bigint, orderId: string)`: Promise<any>
  - Deletes an existing order.

#### Enum: OrderType

```typescript
enum OrderType {
  LIMIT,
  MARKET,
  STOP,
  STOP_LIMIT,
}
```

Represents the type of order:

- `LIMIT` - A limit order is an order to buy or sell an asset at a specific price or better. It allows traders to set the maximum price they're willing to pay or the minimum price they're willing to accept.
- `MARKET` - A market order is an order to buy or sell an asset immediately at the best available current price. It guarantees execution but does not guarantee a specific price.
- `STOP` - A stop order, also known as a stop-loss order, is an order to buy or sell an asset when its price reaches a specified level. It's designed to limit an investor's loss or to protect a profit on an existing position.
- `STOP_LIMIT` - A stop-limit order combines features of both stop and limit orders. It triggers a limit order to buy or sell an asset once a specified stop price is reached. It provides more control over the execution price compared to a regular stop order.
- `TAKE_PROFIT_MARKET`

### Data Structures

#### Interface: Order

```typescript
interface Order {
  metadata: {
    genesis: bigint;
    expiration: bigint;
    trackingCode: string;
    referrer: string;
  };
  trader: {
    nonce: bigint;
    accountId: bigint;
    signer: string;
  };
  trade: {
    t: OrderType;
    marketId: bigint;
    size: bigint;
    price: bigint;
  };
  conditions: {
    expected: `0x${string}`;
    target: `0x${string}`;
    selector: `0x${string}`;
    data: `0x${string}`;
  }[];
}
```

#### Interface: Market

```typescript
interface Market {
  id: bigint;
  symbol: string;
}
```

### Data Structures

#### Interface: Order

The Order object represents an order in the system and has the following structure:

```typescript
interface Order {
  metadata: {
    genesis: bigint;
    expiration: bigint;
    trackingCode: string;
    referrer: string;
  };
  trader: {
    nonce: bigint;
    accountId: bigint;
    signer: string;
  };
  trade: {
    t: OrderType;
    marketId: bigint;
    size: bigint;
    price: bigint;
  };
  conditions: any[];
}
```

### Development

To build the SDK:

```bash
npm run build
```

To run tests:

```bash
npm test
```

### License
This project is licensed under the MIT License.
