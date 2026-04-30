import { NextRequest, NextResponse } from "next/server";
import { SecurityTracker } from "@/lib/security-tracker";

/**
 * HONEYPOT ENDPOINT
 * 
 * This route is NOT used by the application. 
 * Any access to this route is considered a high-severity security breach attempt.
 */
export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  
  await SecurityTracker.flagAttacker(ip, "HONEYPOT_TRIGGERED", {
    endpoint: "/api/admin/config",
    userAgent: req.headers.get("user-agent"),
  });

  return new NextResponse("Unauthorized", { status: 401 });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
