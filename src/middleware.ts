import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SecurityTracker } from "./lib/security-tracker";

// Simple in-memory rate limiting for the demonstration
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();
const RATE_LIMIT_THRESHOLD = 100; // 100 requests
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

export default authMiddleware({
  publicRoutes: ["/", "/api/webhooks(.*)", "/api/health"],
  beforeAuth: async (req: NextRequest) => {
    // 1. Attacker Tracking & IP Logging
    const { blocked, ip } = await SecurityTracker.logRequest(req);
    if (blocked) {
      return new NextResponse("Access Denied", { status: 403 });
    }

    // 2. Rate Limiting
    const now = Date.now();
    const rateLimit = rateLimitMap.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };

    if (now > rateLimit.resetTime) {
      rateLimit.count = 1;
      rateLimit.resetTime = now + RATE_LIMIT_WINDOW;
    } else {
      rateLimit.count++;
    }

    rateLimitMap.set(ip, rateLimit);

    if (rateLimit.count > RATE_LIMIT_THRESHOLD) {
      await SecurityTracker.flagAttacker(ip, "RATE_LIMIT_EXCEEDED", { count: rateLimit.count });
      return new NextResponse("Too Many Requests", { status: 429 });
    }

    return NextResponse.next();
  },
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
