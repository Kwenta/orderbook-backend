import { stringToHex } from "viem";

export const TRACKING_CODE = stringToHex("KWENTA", { size: 32 });

export const markets = [{ id: "144", name: "ETH-PERP" }] as const;
