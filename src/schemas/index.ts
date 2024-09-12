import { z } from "@hono/zod-openapi";
import { TRACKING_CODE } from "../constants";
import { checksumAddress, isAddress } from "viem";
import * as viem from "viem";
import { ZodSchema } from "zod";

export const orderId = z.string().openapi({
  example: "123",
});

export const hexString = z
  .string()
  .refine((s) => s.startsWith("0x"))
  .transform((s) => s as `0x${string}`);

export const zodAddress = () =>
  hexString.refine((s) => isAddress(s)).transform((s) => checksumAddress(s));

type Sizes =
  | 8
  | 16
  | 24
  | 32
  | 40
  | 48
  | 56
  | 64
  | 72
  | 80
  | 88
  | 96
  | 104
  | 112
  | 120
  | 128
  | 136
  | 144
  | 152
  | 160
  | 168
  | 176
  | 184
  | 192
  | 200
  | 208
  | 216
  | 224
  | 232
  | 240
  | 248
  | 256;

export const uint = (n: Sizes = 256) => {
  if (n < 0 || n > 256) throw new Error("Invalid uint size");
  const maxValue = viem[`maxUint${n}`];
  return z.bigint().refine((x) => x > BigInt(0) && x < maxValue);
};

export const int = (n: Sizes = 256) => {
  if (n < 0 || n > 256) throw new Error("Invalid uint size");
  const maxValue = viem[`maxInt${n}`];
  const minValue = viem[`minInt${n}`];
  return z.bigint().refine((x) => x > minValue && x < maxValue);
};

export const marketId = uint(128);

export const order = z.object({
  accountId: uint(128),
  marketId: uint(128),
  relayer: zodAddress(),
  amount: int(128),
  price: uint(256),
  limitOrderMaker: z.boolean(),
  expiration: uint(256),
  nonce: uint(256),
  trackingCode: hexString.refine((s) => s.length === 64 && s === TRACKING_CODE),
});

export type Order = z.infer<typeof order>;

export const bodySchema = (schema: z.ZodSchema) => ({
  content: {
    "application/json": {
      schema,
    },
  },
});

export const okSchema = (schema: z.ZodSchema, description = "") => ({
  content: {
    "application/json": {
      schema,
    },
  },
  description,
});

export const notFoundSchema = (description = "") => ({
  content: {
    "application/json": {
      schema: z.object({
        message: z.string(),
      }),
    },
  },
  description,
});

export const badRequestSchema = {
  content: {
    "application/json": {
      schema: z.object({
        message: z.string(),
      }),
    },
  },
  description: "The request was malformed",
};

export type Body<
  T extends { body: { content: { "application/json": { schema: ZodSchema } } } }
> = z.infer<T["body"]["content"]["application/json"]["schema"]>;