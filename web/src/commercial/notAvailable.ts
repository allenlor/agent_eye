import { type NextApiRequest, type NextApiResponse } from "next";

export function notInThisBuild(res: NextApiResponse): void {
  res.status(404).json({
    error: "This feature is not available in this build.",
  });
}

export function routeParam(
  query: NextApiRequest["query"],
  key: string,
): string | null {
  const value = query[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function notAvailableResponse(): Response {
  return Response.json(
    { error: "This feature is not available in this build." },
    { status: 404 },
  );
}
