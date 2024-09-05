import { OpenAPIHono, z, createRoute } from "@hono/zod-openapi";
import { marketId, notFoundSchema, okSchema, orderId } from "../../../schemas";
import type { ZodSchema } from "zod";
type Body<T extends { body: { content: { "application/json": { schema: ZodSchema } } } }> = z.infer<T["body"]["content"]["application/json"]["schema"]>;

export const userOrderRouter = new OpenAPIHono();

const orderSchema = z
  .object({
    id: z.string().describe("The unique identifier of the order"),
    nonce: z.number().describe("The nonce of the order"),
    signature: z.string().refine((s) => s.length === 132, { message: "Signature must be 132 characters long" }),
  })
  .openapi("SignedOrder");

const updateOrderSchema = {
  params: z.object({ market: marketId, orderId: orderId }),
  body: {
    content: {
      "application/json": { schema: orderSchema.partial() },
    },
  },
};

const deleteOrderSchema = {
  params: z.object({ market: marketId, orderId: orderId }),
};

const getRoute = createRoute({
  method: "get",
  path: "/{user}/{orderId}",
  request: deleteOrderSchema,
  responses: {
    200: okSchema(z.object({}).describe("Order data"), "Get the data for an order"),
    404: notFoundSchema("The order was not found"),
  },
});

const deleteRoute = createRoute({
  method: "delete",
  path: "/{user}/{orderId}",
  request: deleteOrderSchema,
  responses: {
    200: okSchema(
      z.object({
        success: z.boolean({ description: "If the order was removed from the book" }),
      }),
      "Remove an order from the book of a specific market"
    ),
    404: notFoundSchema("The order was not found"),
  },
});

const updateRoute = createRoute({
  method: "patch",
  path: "/{user}/{orderId}",
  request: updateOrderSchema,
  responses: {
    200: okSchema(
      z.object({
        success: z.boolean({ description: "If the order was updated" }),
      }),
      "Update an order in the book of a specific market"
    ),
    404: notFoundSchema("The order was not found"),
  },
});

userOrderRouter.openapi(getRoute, async (c) => {
  const market = c.req.param("market");
  const orderId = Number(c.req.param("orderId"));

  if (!market || !orderId) {
    return c.json({ message: "The resource was not found" }, 404);
  }

  return c.json({ market, orderId, data: {} }, 200);
});

userOrderRouter.openapi(updateRoute, async (c) => {
  const { user, orderId } = c.req.param();
  const newOrder = (await c.req.json()) as Body<typeof updateOrderSchema>;

  if (!user || !orderId) {
    return c.json({ message: "The resource was not found" }, 404);
  }

  return c.json({ success: true }, 200);
});

userOrderRouter.openapi(deleteRoute, async (c) => {
  const { user, orderId } = c.req.param();

  if (!user || !orderId) {
    return c.json({ message: "The resource was not found" }, 404);
  }

  return c.json({ success: true }, 200);
});
