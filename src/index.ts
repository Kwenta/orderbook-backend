import { serve } from "@hono/node-server";
import { app } from "./routes";
import { init } from "./engine/matching-engine";

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

init();

const server = serve(app);
