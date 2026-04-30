import { NextRequest, NextResponse } from "next/server";
import { SecurityTracker } from "@/lib/security-tracker";
import { auth } from "@clerk/nextjs";

/**
 * SECURITY INCIDENT REPORTING ENDPOINT
 * 
 * Receives reports from the client-side Security Monitor.
 */
export async function POST(req: NextRequest) {
  const { userId } = auth();
  const body = await req.json();
  const { type, details, timestamp, userAgent, href } = body;

  const ip = req.headers.get("x-forwarded-for") || "unknown";

  await SecurityTracker.flagAttacker(ip, `CLIENT_SECURITY_${type}`, {
    userId,
    details,
    timestamp,
    userAgent,
    href
  });

  return new NextResponse(null, { status: 204 });
}
