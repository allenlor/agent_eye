import { notAvailableResponse } from "@/src/commercial/notAvailable";

export const dynamic = "force-dynamic";

export function POST() {
  return notAvailableResponse();
}
