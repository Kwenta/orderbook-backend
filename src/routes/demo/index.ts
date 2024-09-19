import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { readFileSync } from "fs";

export const demoRouter = new OpenAPIHono();

const demoRoute = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: {
        "text/html": { schema: z.any() },
      },
      description: "The Demo page for testing the backend",
    },
  },
});

demoRouter.openapi(demoRoute, (c) => {
  const demoCSS = readFileSync("./static/index.css", "utf-8");
  const demoPage = readFileSync("./static/index.html", "utf-8").replace(
    "<title>Dashboard</title>",
    `<title>Dashboard</title>\n<style>\n${demoCSS}
          </style>`
  );

  return c.html(demoPage);
});
