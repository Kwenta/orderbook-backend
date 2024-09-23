import { stringToHex } from "viem";

export const TRACKING_CODE = stringToHex("KWENTA", { size: 32 });

export const markets = [{ id: "0x90A664846960AaFA2c164605Aebb8e9Ac338f9a0", name: "ETH-PERP" }] as const;
