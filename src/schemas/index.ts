import { z } from "@hono/zod-openapi";

export const marketId = z.string().openapi({
  example: "123",
});

export const orderId = z.string().openapi({
  example: "123",
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
