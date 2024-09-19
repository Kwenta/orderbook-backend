import { z } from "@hono/zod-openapi";
import { TRACKING_CODE } from "../constants";
import { checksumAddress, isAddress } from "viem";
import * as viem from "viem";
import type { ZodBigInt, ZodEffects, ZodSchema, ZodString } from "zod";
import type { Sizes } from "../types";

export const orderId = z.string().openapi({
  example: "123",
});

export const hexString = z
  .string()
  .refine((s) => s.startsWith("0x"))
  .transform((s) => s as `0x${string}`);

export const zodAddress = () => hexString.refine((s) => isAddress(s)).transform((s) => checksumAddress(s));

export const uint = (n: Sizes = 256): ZodEffects<ZodEffects<ZodString, bigint, string>, bigint, string> => {
  if (n < 0 || n > 256) throw new Error("Invalid uint size");
  const maxValue = viem[`maxUint${n}`];
  return z
    .string()
    .transform(BigInt)
    .refine((x) => x >= BigInt(0) && x < maxValue, `Value must be between 0 and ${maxValue}`);
};

export const int = (n: Sizes = 256): ZodEffects<ZodEffects<ZodString, bigint, string>, bigint, string> => {
  if (n < 0 || n > 256) throw new Error("Invalid uint size");
  const maxValue = viem[`maxInt${n}`];
  const minValue = viem[`minInt${n}`];
  return z
    .string()
    .transform(BigInt)
    .refine((x) => x > minValue && x < maxValue, `Value must be between ${minValue} and ${maxValue}`);
};

export const marketId = z.string();
// export const marketId = uint(128);

export const orderSchema = z.object({
  // accountId: uint(128),
  accountId: z.string(),
  // marketId: uint(128),
  marketId: z.string(),
  relayer: zodAddress(),
  amount: int(128),
  price: uint(256),
  limitOrderMaker: z.boolean(),
  expiration: uint(256),
  nonce: uint(256),
  trackingCode: hexString.refine((s) => s === TRACKING_CODE),
});

export type Order = z.infer<typeof orderSchema>;

export const paginationSchema = z.object({
  offset: z.number().optional().default(0),
  limit: z.number().optional().default(10),
});

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

export const notFoundSchema = {
  content: {
    "application/json": {
      schema: z.object({
        message: z.string(),
      }),
    },
  },
  description: "The requested resource was not found",
};

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

export const internalServerErrorSchema = {
  content: {
    "application/json": {
      schema: z.object({
        message: z.string(),
      }),
    },
  },
  description: "Something went wrong internally",
};

export type Body<T extends { body: { content: { "application/json": { schema: ZodSchema } } } }> = z.infer<T["body"]["content"]["application/json"]["schema"]>;
