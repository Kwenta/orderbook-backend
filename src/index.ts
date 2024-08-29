import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { bookRouter } from "./book";
import { orderRouter } from "./book/orders";

const app = new OpenAPIHono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/book", bookRouter);
app.route("/orders", orderRouter);

app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "0.0.1",
    title: "Kwenta Matching Engine API",
  },
});

app.get("/ui", swaggerUI({ url: "/doc" }));

export default app;
