import { type NextApiRequest, type NextApiResponse } from "next";

import { notInThisBuild } from "@/src/commercial/notAvailable";

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  notInThisBuild(res);
}
