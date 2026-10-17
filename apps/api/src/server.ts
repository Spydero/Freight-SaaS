import "./load-env.js";
import { createApp } from "./app.js";
import { env } from "./lib/env.js";

const app = createApp();

app.listen(env.API_PORT, () => {
  console.log(`ELIOS API listening on ${env.API_ORIGIN}`);
});
