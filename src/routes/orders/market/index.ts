import { OpenAPIHono, z, createRoute } from "@hono/zod-openapi";
import { badRequestSchema, bodySchema, marketId, notFoundSchema, okSchema, orderId } from "../../../schemas";
import type { ZodSchema } from "zod";
import { engines } from "engine/matching-engine";
import type { Market } from "../../../constants";
type Body<T extends { body: { content: { "application/json": { schema: ZodSchema } } } }> = z.infer<T["body"]["content"]["application/json"]["schema"]>;

export const marketOrderRouter = new OpenAPIHono();

const orderSchema = z
  .object({
    id: z.string().describe("The unique identifier of the order"),
    nonce: z.number().describe("The nonce of the order"),
    signature: z.string().refine((s) => s.length === 132, { message: "Signature must be 132 characters long" }),
  })
  .openapi("SignedOrder");

const addOrderSchema = {
  params: z.object({ market: marketId }),
  body: {
    content: {
      "application/json": { schema: orderSchema },
    },
  },
};

const updateOrderSchema = {
  params: z.object({ market: marketId, orderId: orderId }),
  body: {
    content: {
      "application/json": { schema: orderSchema.partial() },
    },
  },
};

const getOrderSchema = {
  params: z.object({ market: marketId, orderId: orderId }),
};

const deleteOrderSchema = {
  body: bodySchema(z.object({ market: marketId, orderId, signature: z.string() })),
};

const addRoute = createRoute({
  method: "post",
  path: "/{market}",
  request: addOrderSchema,
  responses: {
    200: okSchema(
      z.object({
        success: z.boolean({ description: "If the order was added to the book" }),
      }),
      "Add an order to the book for a specific market"
    ),
    404: notFoundSchema("The market was not found"),
    400: badRequestSchema,
  },
});

const getRoute = createRoute({
  method: "get",
  path: "/{market}/{orderId}",
  request: getOrderSchema,
  responses: {
    200: okSchema(z.object({}).describe("Order data"), "Get the data for an order"),
    404: notFoundSchema("The order was not found"),
    400: badRequestSchema,
  },
});

const deleteRoute = createRoute({
  method: "delete",
  path: "/{market}/{orderId}",
  request: deleteOrderSchema,
  responses: {
    200: okSchema(
      z.object({
        success: z.boolean({ description: "If the order was removed from the book" }),
      }),
      "Remove an order from the book of a specific market"
    ),
    404: notFoundSchema("The order was not found"),
    400: badRequestSchema,
  },
});

const updateRoute = createRoute({
  method: "patch",
  path: "/{market}/{orderId}",
  request: updateOrderSchema,
  responses: {
    200: okSchema(
      z.object({
        success: z.boolean({ description: "If the order was updated" }),
      }),
      "Update an order in the book of a specific market"
    ),
    404: notFoundSchema("The order was not found"),
    400: badRequestSchema,
  },
});

marketOrderRouter.openapi(addRoute, async (c) => {
  const market = c.req.param("market");
  const order = (await c.req.json()) as Body<typeof addOrderSchema>;

  if (!market) return c.json({ message: "No market was provided" }, 400);
  if (!order) return c.json({ message: "No order was provided" }, 400);

  if (!engines.has(market as Market)) {
    return c.json({ message: "The market was not found" }, 404);
  }

  return c.json({ success: true }, 200);
});

marketOrderRouter.openapi(getRoute, async (c) => {
  const market = c.req.param("market");
  const orderId = Number(c.req.param("orderId"));

  if (!market) return c.json({ message: "No market was provided" }, 400);
  if (!orderId) return c.json({ message: "No order was provided" }, 400);

  if (!engines.has(market as Market)) {
    return c.json({ message: "The market was not found" }, 404);
  }

  return c.json({ market, orderId, data: {} }, 200);
});

marketOrderRouter.openapi(updateRoute, async (c) => {
  const { market, orderId } = c.req.param();
  const newOrder = (await c.req.json()) as Body<typeof updateOrderSchema>;

  if (!market) return c.json({ message: "No market was provided" }, 400);
  if (!orderId) return c.json({ message: "No order was provided" }, 400);
  if (!newOrder) return c.json({ message: "No new order was provided" }, 400);

  if (!engines.has(market as Market)) {
    return c.json({ message: "The market was not found" }, 404);
  }

  return c.json({ success: true }, 200);
});

marketOrderRouter.openapi(deleteRoute, async (c) => {
  const { market, orderId, signature } = (await c.req.json()) as Body<typeof deleteOrderSchema>;

  if (!market) return c.json({ message: "No market was provided" }, 400);
  if (!orderId) return c.json({ message: "No order was provided" }, 400);
  if (!signature) return c.json({ message: "No signature was provided" }, 400);

  if (!engines.has(market as Market)) {
    return c.json({ message: "The market was not found" }, 404);
  }

  return c.json({ success: true }, 200);
});
