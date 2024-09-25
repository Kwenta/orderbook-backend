import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { bookRouter } from "./book";
import { orderRouter } from "./orders";
import { marketRouter } from "./markets";
import { demoRouter } from "./demo";

import { logger } from "hono/logger";

export const app = new OpenAPIHono();

app.use(logger());

app.route("/book", bookRouter);
app.route("/markets", marketRouter);
app.route("/orders", orderRouter);
app.route("/demo", demoRouter);

app.doc("/doc", { openapi: "3.0.0", info: { version: "0.0.1", title: "Kwenta Matching Engine API" } });
app.get("/ui", swaggerUI({ url: "/doc" }));
