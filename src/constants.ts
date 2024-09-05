export const markets = ["A", "B", "C"] as const;

export type Market = (typeof markets)[number];
