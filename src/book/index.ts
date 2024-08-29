import { OpenAPIHono, z, createRoute } from "@hono/zod-openapi";

export const bookRouter = new OpenAPIHono();

const getBookSchema = z.object({
  market: z.string().openapi({
    param: {
      name: "market",
      in: "path",
    },
    example: "",
  }),
});

const BookSchema = z
  .object({
    id: z.string().openapi({
      example: "123",
    }),
  })
  .openapi("Book");

const route = createRoute({
  method: "get",
  path: "/{market}",
  request: {
    params: getBookSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: BookSchema },
      },
      description: "Retrieve the book for a specific market",
    },
  },
});

bookRouter.openapi(route, (c) => {
  const market = c.req.param("market");
  return c.json({ market });
});
