import { OpenAPIHono, z, createRoute } from "@hono/zod-openapi";
import { marketId, notFoundSchema, okSchema } from "../../schemas";

export const bookRouter = new OpenAPIHono();

const getBookSchema = z.object({ market: marketId });

const BookSchema = z.object({ market: marketId }).openapi("Book");

const route = createRoute({
  method: "get",
  path: "/{market}",
  request: { params: getBookSchema },
  responses: {
    200: okSchema(BookSchema, "Retrieve the book for a specific market"),
    404: notFoundSchema("The book was not found"),
  },
});

bookRouter.openapi(route, (c) => {
  const market = c.req.param("market");

  if (!market) {
    return c.json({ message: "The resource was not found" }, 404);
  }

  return c.json({ market }, 200);
});
