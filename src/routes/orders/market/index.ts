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
} from "../../../schemas";
import { engines } from "../../../engine/matching-engine";
import { makeSafe } from "../../../utils";
import type { Body } from "../../../schemas";
import { Market } from "../../../types";

export const marketOrderRouter = new OpenAPIHono();

const orderSchema = z
  .object({
    id: z.string().describe("The unique identifier of the order"),
    order: oSchema,
    user: hexString,
    signature: hexString.refine((s) => s.length === 132, {
      message: "Signature must be 132 characters long",
    }),
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
  params: z.object({ market: marketId, orderId }),
  body: {
    content: {
      "application/json": { schema: orderSchema },
    },
  },
};

const getOrderSchema = {
  params: z.object({ market: marketId, orderId }),
};

const deleteOrderSchema = {
  params: z.object({ market: marketId, orderId }),
  body: bodySchema(z.object({ signature: z.string() })),
};

const addRoute = createRoute({
  method: "post",
  path: "/{market}",
  request: addOrderSchema,
  responses: {
    200: okSchema(
      z.object({
        success: z.boolean({
          description: "If the order was added to the book",
        }),
        orderId: z.string({
          description: "The unique identifier of the order",
        }),
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
  path: "/{market}/{orderId}",
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

marketOrderRouter.openapi(
  addRoute,
  makeSafe(async (c) => {
    const { market } = c.req.param();
    const { order, signature, user } = (await c.req.json()) as Body<
      typeof addOrderSchema
    >;

    if (!market) return c.json({ message: "No market was provided" }, 400);
    if (!order) return c.json({ message: "No order was provided" }, 400);

    const engine = engines.get(market as Market);
    if (!engine) return c.json({ message: "The market was not found" }, 404);

    const orderId = await engine.addOrder({ order, user, signature });

    return c.json({ success: true, orderId }, 200);
  })
);

marketOrderRouter.openapi(
  getRoute,
  makeSafe(async (c) => {
    const { market, orderId } = c.req.param();

    if (!market) return c.json({ message: "No market was provided" }, 400);
    if (!orderId) return c.json({ message: "No order was provided" }, 400);

    const engine = engines.get(market as Market);
    if (!engine) return c.json({ message: "The market was not found" }, 404);

    const data = engine.getOrder(orderId);
    return c.json({ market, orderId, data }, 200);
  })
);

marketOrderRouter.openapi(
  updateRoute,
  makeSafe(async (c) => {
    const { market, orderId } = c.req.param();
    const newOrder = (await c.req.json()) as Body<typeof updateOrderSchema> & {
      signature: `0x${string}`;
    };

    if (!market) return c.json({ message: "No market was provided" }, 400);
    if (!orderId) return c.json({ message: "No order was provided" }, 400);
    if (!newOrder) return c.json({ message: "No new order was provided" }, 400);

    const engine = engines.get(market as Market);
    if (!engine) return c.json({ message: "The market was not found" }, 404);

    await engine.updateOrder({ ...newOrder, id: orderId });

    return c.json({ success: true }, 200);
  })
);

marketOrderRouter.openapi(
  deleteRoute,
  makeSafe(async (c) => {
    const { market, orderId } = c.req.param();
    const { signature } = (await c.req.json()) as Body<
      typeof deleteOrderSchema
    >;

    if (!market) return c.json({ message: "No market was provided" }, 400);
    if (!orderId) return c.json({ message: "No order was provided" }, 400);
    if (!signature)
      return c.json({ message: "No signature was provided" }, 400);

    const engine = engines.get(market as Market);
    if (!engine) return c.json({ message: "The market was not found" }, 404);

    await engine.deleteOrder(orderId, signature);

    return c.json({ success: true }, 200);
  })
);
