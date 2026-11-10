import crypto from "crypto";

import { type NextApiRequest, type NextApiResponse } from "next";

import { env } from "@/src/env.mjs";

type AdminAuthResult = {
  isAuthorized: boolean;
  error?: string;
};

type AdminAuthOptions = {
  isAllowedOnLangfuseCloud?: boolean;
};

function sameSecret(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export class AdminApiAuthService {
  static verifyAdminAuthFromAuthString(
    authString: string,
    _options: AdminAuthOptions = {},
  ): AdminAuthResult {
    if (!env.ADMIN_API_KEY) {
      return { isAuthorized: false, error: "ADMIN_API_KEY is not set" };
    }

    const [scheme, token] = authString.split(" ");
    if (scheme !== "Bearer" || !token || !sameSecret(token, env.ADMIN_API_KEY)) {
      return { isAuthorized: false, error: "Unauthorized: Invalid token" };
    }

    return { isAuthorized: true };
  }

  static handleAdminAuth(
    req: NextApiRequest,
    res: NextApiResponse,
    options: AdminAuthOptions = {},
  ): boolean {
    const authorization = req.headers.authorization;
    const authResult = authorization
      ? AdminApiAuthService.verifyAdminAuthFromAuthString(authorization, options)
      : {
          isAuthorized: false,
          error: "Unauthorized: No authorization header provided",
        };

    if (authResult.isAuthorized) return true;

    const status = authResult.error?.startsWith("Unauthorized") ? 401 : 403;
    res.status(status).json({ error: authResult.error });
    return false;
  }
}
