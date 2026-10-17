import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const monorepoRoot = resolve(here, "../../..");
config({ path: resolve(monorepoRoot, ".env") });
config({ path: resolve(here, "../.env") });
