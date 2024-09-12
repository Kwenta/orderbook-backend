import { OpenAPIHono, z, createRoute } from "@hono/zod-openapi";
import {
  badRequestSchema,
  marketId,
  notFoundSchema,
  okSchema,
} from "../../schemas";
import { engines } from "../../engine/matching-engine";
import type { Market } from "../../types";

export const bookRouter = new OpenAPIHono();

const getBookSchema = {
  params: z.object({
    market: marketId,
  }),
  query: z.object({
    offset: z.number().optional().default(0),
    limit: z.number().optional().default(10),
  }),
};

const BookSchema = z.object({ market: marketId }).openapi("Book");

const route = createRoute({
  method: "get",
  path: "/{market}",
  request: getBookSchema,
  responses: {
    200: okSchema(BookSchema, "Retrieve the book for a specific market"),
    404: notFoundSchema("The book was not found"),
    400: badRequestSchema,
  },
});

bookRouter.openapi(route, (c) => {
  const { market } = c.req.param();
  const { offset, limit } = c.req.query();

  if (!market) return c.json({ message: "The resource was not found" }, 400);

  const engine = engines.get(market as Market);
  if (!engine) return c.json({ message: "The market was not found" }, 404);

  const orders = engine.getOrders();

  const slicedOrders = orders.slice(
    Number(offset),
    Number(offset) + Number(limit)
  );
  return c.json({ market, orders: slicedOrders }, 200);
});
