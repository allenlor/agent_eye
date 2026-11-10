import fs from "node:fs";
import path from "node:path";

const roots = ["web/src", "worker/src"];
const importPattern =
  /from\s+["'](?:@\/src\/ee\/|@langfuse\/ee(?:\/|["'])|(?:\.\.\/)+ee\/|\.\/ee\/)/;

function isReferenceTree(rel) {
  const normalized = rel.split(path.sep).join("/");
  return (
    normalized.startsWith("ee/") ||
    normalized.includes("/ee/") ||
    normalized.startsWith("__tests__/") ||
    normalized.includes("/__tests__/") ||
    normalized.includes(".servertest.") ||
    normalized.includes(".clienttest.") ||
    normalized.includes(".test.")
  );
}

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(ent.name)) out.push(full);
  }
  return out;
}

const violations = [];
for (const root of roots) {
  for (const file of walk(root)) {
    const rel = path.relative(root, file);
    if (isReferenceTree(rel)) continue;
    const text = fs.readFileSync(file, "utf8");
    if (importPattern.test(text)) violations.push(path.relative(process.cwd(), file));
  }
}

if (violations.length > 0) {
  console.error(
    "Product code imports an enterprise directory. Move the call to web/src/commercial or worker/src/commercial.",
  );
  for (const file of violations) console.error(`  ${file}`);
  process.exit(1);
}

console.log("Commercial boundary check passed.");
