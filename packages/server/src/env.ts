import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(import.meta.url), "../../../");

config({ path: resolve(repoRoot, ".env") });
