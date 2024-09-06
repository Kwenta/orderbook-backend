export const markets = ["test-market"] as const;

export type Market = (typeof markets)[number];
