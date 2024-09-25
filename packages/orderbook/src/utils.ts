import type { Context, Env, Handler, Next } from "hono";
import { badRequestSchema, internalServerErrorSchema, notFoundSchema } from "./schemas";
import type { StatusCode } from "hono/utils/http-status";

export class HTTPError extends Error {
  constructor(public status: StatusCode, message: string) {
    super(message);
  }
}

export const makeSafe =
  <T extends Env>(router: Handler<T>): Handler<T> =>
  async (c: Context, next: Next) => {
    try {
      return await router(c, next);
    } catch (e) {
      if (e instanceof HTTPError) {
        return c.json({ message: e.message }, e.status);
      }
      console.error(e);
      c.json({ message: "An error occurred" }, 500);
    }
  };

export const standardResponses = {
  400: badRequestSchema,
  404: notFoundSchema,
  500: internalServerErrorSchema,
} as const;
