import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { bookRouter } from "./routes/book";
import { orderRouter } from "./routes/orders";

export const app = new OpenAPIHono();

app.route("/book", bookRouter);
app.route("/orders", orderRouter);

app.doc("/doc", { openapi: "3.0.0", info: { version: "0.0.1", title: "Kwenta Matching Engine API" } });
app.get("/ui", swaggerUI({ url: "/doc" }));
