The core features of the matching engine are as follows:


1. Nonce management
    - Keeps track of the most recently used nonce of the user and persists this to the database for recovery in case of crashes
2. Stop-book
    - Holds information about STOP and STOP_LIMIT orders that need to be added to the book when prices are hit. Tracks prices with pyth but can be extended to support any price oracle / stream of data
    - When an order is swapped from a STOP to a market order or a STOP_LIMIT to a limit order, the `stopped` property is flipped to `true` to make it clear that this order used to be a stop, and is now a different type of order
3. Main book
    - Holds the open orders on both sides of the book, periodically checking for possible settlement between orders
4. Pruning
    - On an interval, attempts to remove any stale or invalid orders from the book