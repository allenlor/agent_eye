import { type Prisma } from "@prisma/client";

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseMetadata(
  input: unknown,
):
  | { ok: true; metadata: Prisma.InputJsonValue | undefined }
  | { ok: false } {
  if (input === undefined) return { ok: true, metadata: undefined };

  let value = input;
  if (typeof input === "string") {
    try {
      value = JSON.parse(input) as unknown;
    } catch {
      return { ok: false };
    }
  }

  if (!isJsonObject(value)) return { ok: false };
  return { ok: true, metadata: value };
}
