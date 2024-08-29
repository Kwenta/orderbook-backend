import { OpenAPIHono, z, createRoute } from "@hono/zod-openapi";

export const orderRouter = new OpenAPIHono();

const orderSchema = z
  .object({
    id: z.string(),
    nonce: z.number(),
    signature: z.string().refine((s) => s.length === 132, { message: "Signature must be 132 characters long" }),
  })
  .openapi("SignedOrder");

const addOrderSchema = {
  params: z.object({
    market: z.string().openapi({
      param: {
        name: "market",
        in: "path",
      },
      example: "",
    }),
  }),
  body: {
    content: {
      "application/json": { schema: orderSchema },
    },
  },
};

const updateOrderSchema = {
  params: z.object({
    market: z.string().openapi({
      param: {
        name: "market",
        in: "path",
      },
      example: "",
    }),
    orderId: z.string().openapi({
      param: {
        name: "orderId",
        in: "path",
      },
      example: "",
    }),
  }),
  body: {
    content: {
      "application/json": { schema: orderSchema.partial() },
    },
  },
};

const deleteOrderSchema = {
  params: z.object({
    market: z.string().openapi({
      param: {
        name: "market",
        in: "path",
      },
      example: "",
    }),
    orderId: z.string().openapi({
      param: {
        name: "orderId",
        in: "path",
      },
      example: "",
    }),
  }),
};

const addRoute = createRoute({
  method: "post",
  path: "/{market}",
  request: addOrderSchema,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean({ description: "If the order was added to the book" }),
          }),
        },
      },
      description: "Add an order to the book for a specific market",
    },
  },
});

const deleteRoute = createRoute({
  method: "delete",
  path: "/{market}/{orderId}",
  request: deleteOrderSchema,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean({ description: "If the order was removed from the book" }),
          }),
        },
      },
      description: "Remove an order from the book of a specific market",
    },
  },
});

const updateRoute = createRoute({
  method: "patch",
  path: "/{market}/{orderId}",
  request: updateOrderSchema,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean({ description: "If the order was updated" }),
          }),
        },
      },
      description: "Update an order in the book of a specific market",
    },
  },
});

const getRoute = createRoute({
  method: "get",
  path: "/{market}/{orderId}",
  request: deleteOrderSchema,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({}).describe("Order data"),
        },
      },
      description: "Get the data for an order",
    },
  },
});

orderRouter.openapi(getRoute, async (c) => {
  const market = c.req.param("market");
  const orderId = Number(c.req.param("orderId"));
  console.log({ market, orderId });
  return c.json({ market, orderId, data: {} });
});

orderRouter.openapi(updateRoute, async (c) => {
  const market = c.req.param("market");
  const orderId = c.req.param("orderId");
  const newOrder = (await c.req.json()) as z.infer<(typeof updateOrderSchema)["body"]["content"]["application/json"]["schema"]>;
  console.log({ market, orderId, newOrder });
  return c.json({ success: true });
});

orderRouter.openapi(addRoute, async (c) => {
  const market = c.req.param("market");
  const order = (await c.req.json()) as z.infer<(typeof addOrderSchema)["body"]["content"]["application/json"]["schema"]>;
  console.log({ market, order });
  return c.json({ success: true });
});

orderRouter.openapi(deleteRoute, async (c) => {
  const market = c.req.param("market");
  const orderId = c.req.param("orderId");
  console.log({ market, orderId });
  return c.json({ success: true });
});
