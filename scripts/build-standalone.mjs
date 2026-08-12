import { cp, mkdir } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const staticSrc = join(root, ".next", "static");
const standaloneDotNext = join(root, ".next", "standalone", ".next");
const standalonePublic = join(root, ".next", "standalone");

await mkdir(standaloneDotNext, { recursive: true });
await cp(staticSrc, standaloneDotNext, { recursive: true });
await cp(join(root, "public"), standalonePublic, { recursive: true });

console.log("Standalone build artifacts created successfully.");
