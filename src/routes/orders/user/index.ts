import { OpenAPIHono, z, createRoute } from "@hono/zod-openapi";
import {
  badRequestSchema,
  bodySchema,
  hexString,
  marketId,
  notFoundSchema,
  okSchema,
  orderId,
  orderSchema as oSchema,
  zodAddress,
} from "../../../schemas";
import { engines, offersOfUser } from "../../../engine/matching-engine";
import type { Market } from "../../../types";
import type { Body } from "../../../schemas";
export const userOrderRouter = new OpenAPIHono();

const orderSchema = z
  .object({
    id: z.string().describe("The unique identifier of the order"),
    user: zodAddress(),
    order: oSchema,
    signature: hexString.refine((s) => s.length === 132, {
      message: "Signature must be 132 characters long",
    }),
  })
  .openapi("SignedOrder");

const updateOrderSchema = {
  params: z.object({ market: marketId, orderId: orderId }),
  body: {
    content: {
      "application/json": { schema: orderSchema },
    },
  },
};

const deleteOrderSchema = {
  params: z.object({ market: marketId, orderId: orderId }),
  body: bodySchema(z.object({ signature: hexString })),
};

const getRoute = createRoute({
  method: "get",
  path: "/{user}/{orderId}",
  request: deleteOrderSchema,
  responses: {
    200: okSchema(
      z.object({}).describe("Order data"),
      "Get the data for an order"
    ),
    404: notFoundSchema("The order was not found"),
    400: badRequestSchema,
  },
});

const deleteRoute = createRoute({
  method: "delete",
  path: "/{user}/{orderId}",
  request: deleteOrderSchema,
  responses: {
    200: okSchema(
      z.object({
        success: z.boolean({
          description: "If the order was removed from the book",
        }),
      }),
      "Remove an order from the book of a specific market"
    ),
    404: notFoundSchema("The order was not found"),
    400: badRequestSchema,
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
    400: badRequestSchema,
  },
});

userOrderRouter.openapi(getRoute, async (c) => {
  const { user, orderId } = c.req.param();

  const market = offersOfUser[user][orderId] ?? "";

  if (!market) return c.json({ message: "The order was not found" }, 404);
  if (!orderId) return c.json({ message: "No orderId was provided" }, 400);
  if (!user) return c.json({ message: "No user was provided" }, 400);

  const engine = engines.get(market as Market);
  if (!engine) return c.json({ message: "The market was not found" }, 404);

  const data = engine.getOrder(orderId);

  return c.json({ market: "", user, orderId, data }, 200);
});

userOrderRouter.openapi(updateRoute, async (c) => {
  const { user, orderId } = c.req.param();
  const newOrder = (await c.req.json()) as Body<typeof updateOrderSchema>;

  if (!orderId) return c.json({ message: "No orderId was provided" }, 400);
  if (!user) return c.json({ message: "No user was provided" }, 400);

  const market = offersOfUser[user][orderId] ?? "";

  if (!market) return c.json({ message: "The order was not found" }, 404);

  const engine = engines.get(market as Market);
  if (!engine) return c.json({ message: "The market was not found" }, 404);
  await engine.updateOrder({ ...newOrder, id: orderId });

  return c.json({ success: true }, 200);
});

userOrderRouter.openapi(deleteRoute, async (c) => {
  const { user, orderId } = c.req.param();

  const { signature } = (await c.req.json()) as Body<typeof deleteOrderSchema>;

  if (!orderId) return c.json({ message: "No orderId was provided" }, 400);
  if (!user) return c.json({ message: "No user was provided" }, 400);

  const market = offersOfUser[user][orderId] ?? "";
  if (!market) return c.json({ message: "The order was not found" }, 404);

  const engine = engines.get(market as Market);
  if (!engine) return c.json({ message: "The market was not found" }, 404);
  await engine.deleteOrder(orderId, signature);

  return c.json({ success: true }, 200);
});
