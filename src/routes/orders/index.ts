import { OpenAPIHono } from "@hono/zod-openapi";
import { marketOrderRouter } from "./market";

export const orderRouter = new OpenAPIHono();

orderRouter.route("/market", marketOrderRouter);
