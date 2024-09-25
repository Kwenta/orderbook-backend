import { OpenAPIHono, z, createRoute } from "@hono/zod-openapi";
import { marketId, okSchema, paginationSchema } from "../../schemas";
import { findEngineOrFail } from "../../engine/matching-engine";
import type { MarketId } from "../../types";
import { makeSafe, standardResponses } from "../../utils";

export const bookRouter = new OpenAPIHono();

const route = createRoute({
  method: "get",
  path: "/{marketId}",
  request: {
    params: z.object({ marketId }),
    query: paginationSchema,
  },
  responses: {
    200: okSchema(
      z.object({ marketId }).openapi("Book"),
      "Retrieve the book for a specific market"
    ),
  },
  ...standardResponses,
});

bookRouter.openapi(
  route,
  makeSafe((c) => {
    const { marketId } = c.req.param();
    const { offset, limit } = c.req.query();

    const engine = findEngineOrFail(marketId as MarketId);
    const orders = engine.getOrders();

    const slicedOrders = orders.slice(
      Number(offset),
      Number(offset) + Number(limit)
    );
    return c.json({ marketId, orders: slicedOrders }, 200);
  })
);
