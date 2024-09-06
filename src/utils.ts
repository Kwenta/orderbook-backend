import { Context } from "hono";

export const makeSafe =
  <T extends (c: Context) => Promise<unknown>>(router: T): T =>
  async (c: Context) => {
    try {
      return await router(c);
    } catch (e) {
      console.error(e);
      return c.json({ message: "An error occurred" }, 500);
    }
  };
