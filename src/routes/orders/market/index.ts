import { OpenAPIHono, z, createRoute } from "@hono/zod-openapi";
import { bodySchema, hexString, marketId, okSchema, orderId, orderSchema as oSchema } from "../../../schemas";
import { findEngineOrFail } from "../../../engine/matching-engine";
import { makeSafe, standardResponses } from "../../../utils";
import type { Body } from "../../../schemas";
import type { MarketId } from "../../../types";

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
  params: z.object({ marketId }),
  body: {
    content: {
      "application/json": { schema: orderSchema.omit({ id: true }) },
    },
  },
};

const updateOrderSchema = {
  params: z.object({ marketId, orderId }),
  body: {
    content: {
      "application/json": { schema: orderSchema },
    },
  },
};

const deleteOrderSchema = {
  params: z.object({ marketId, orderId }),
  body: bodySchema(z.object({ signature: z.string() })),
};

const addRoute = createRoute({
  method: "post",
  path: "/{marketId}",
  request: addOrderSchema,
  responses: {
    201: okSchema(
      z.object({
        success: z.boolean({ description: "If the order was added to the book" }),
        orderId: z.string({ description: "The unique identifier of the order" }),
      }),
      "Add an order to the book for a specific market"
    ),
    ...standardResponses,
  },
});

const getRoute = createRoute({
  method: "get",
  path: "/{marketId}/{orderId}",
  request: {
    params: z.object({ marketId, orderId }),
  },
  responses: {
    200: okSchema(orderSchema.describe("Order data"), "Get the data for an order"),
    ...standardResponses,
  },
});

const getAllRoute = createRoute({
  method: "get",
  path: "/{marketId}",
  request: {
    params: z.object({ marketId }),
  },
  responses: {
    200: okSchema(z.array(orderSchema.describe("Order data")), "Get the data for all orders "),
    ...standardResponses,
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
    ...standardResponses,
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
    ...standardResponses,
  },
});

marketOrderRouter.openapi(
  addRoute,
  makeSafe(async (c) => {
    const { marketId } = c.req.param();
    const { order, signature, user } = (await c.req.json()) as Body<typeof addOrderSchema>;

    const engine = findEngineOrFail(marketId as MarketId);

    const orderId = await engine.addOrder({
      order: { ...order, marketId: BigInt(marketId) },
      user,
      signature,
    });

    return c.json({ success: true, orderId }, 201);
  })
);

marketOrderRouter.openapi(
  getRoute,
  makeSafe(async (c) => {
    const { marketId, orderId } = c.req.param();
    const engine = findEngineOrFail(marketId as MarketId);
    const data = engine.getOrder(orderId);

    return c.json({ marketId, orderId, data }, 200);
  })
);

marketOrderRouter.openapi(
  getAllRoute,
  makeSafe(async (c) => {
    const { marketId } = c.req.param();
    const engine = findEngineOrFail(marketId as MarketId);
    const data = structuredClone(engine.getOrders());

    data.forEach((d) => {
      d.signature = undefined;
    });

    return c.json(data, 200);
  })
);

marketOrderRouter.openapi(
  updateRoute,
  makeSafe(async (c) => {
    const { market, orderId } = c.req.param();
    const newOrder = (await c.req.json()) as Body<typeof updateOrderSchema> & {
      signature: `0x${string}`;
    };

    const engine = findEngineOrFail(market as MarketId);
    await engine.updateOrder({ ...newOrder, id: orderId });

    return c.json({ success: true }, 200);
  })
);

marketOrderRouter.openapi(
  deleteRoute,
  makeSafe(async (c) => {
    const { market, orderId } = c.req.param();
    const { signature } = (await c.req.json()) as Body<typeof deleteOrderSchema>;

    const engine = findEngineOrFail(market as MarketId);
    await engine.deleteOrder(orderId, signature);

    return c.json({ success: true }, 200);
  })
);
