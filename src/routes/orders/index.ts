import { OpenAPIHono } from "@hono/zod-openapi";
import { marketOrderRouter } from "./market";
import { userOrderRouter } from "./user";

export const orderRouter = new OpenAPIHono();

orderRouter.route("/market", marketOrderRouter);
orderRouter.route("/user", userOrderRouter);
