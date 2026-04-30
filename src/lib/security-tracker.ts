import { NextRequest } from "next/server";
import prisma from "./prisma";
import { SecurityShield } from "./security";

export class SecurityTracker {
  /**
   * Logs an incoming request for security auditing.
   * Captures IP, User-Agent, and potential fingerprinting data.
   */
  static async logRequest(req: NextRequest) {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const path = req.nextUrl.pathname;
    const method = req.method;

    // Log the request for forensic analysis
    console.log(`[Forensics] ${method} ${path} - IP: ${ip} - UA: ${userAgent}`);

    // Check if IP is blacklisted
    const isBlacklisted = await this.checkBlacklist(ip);
    if (isBlacklisted) {
      return { blocked: true, reason: "IP_BLACKILISTED" };
    }

    // Heuristic: Flag unusual patterns (e.g., very long paths, weird characters)
    if (path.length > 500 || /<script|%3Cscript/i.test(path)) {
      await this.flagAttacker(ip, "SUSPICIOUS_PATH_PATTERN", { path });
    }

    return { blocked: false, ip };
  }

  private static async checkBlacklist(ip: string): Promise<boolean> {
    // In a real system, this would query a fast cache like Redis
    const blacklistEntry = await prisma.auditLog.findFirst({
      where: {
        action: "IP_BLACKLISTED",
        entityId: ip,
      },
    });
    return !!blacklistEntry;
  }

  static async flagAttacker(ip: string, reason: string, details: Record<string, unknown> = {}) {
    console.warn(`🚨 ATTACKER FLAGGED: ${ip} - ${reason}`);

    await prisma.auditLog.create({
      data: {
        action: "ATTACKER_FLAGGED",
        actorType: "system",
        actorId: "SECURITY_TRACKER",
        entityType: "attacker",
        entityId: ip,
        details: { ...details, reason, timestamp: new Date().toISOString() },
      },
    });

    // If critical enough, trigger Nuclear Mode or auto-blacklist
    if (reason === "HONEYPOT_TRIGGERED") {
      await this.blacklistIp(ip, "Triggered honeypot endpoint");
      await SecurityShield.activateNuclearMode(`Honeypot breach by IP: ${ip}`);
    }
  }

  static async blacklistIp(ip: string, reason: string) {
    await prisma.auditLog.create({
      data: {
        action: "IP_BLACKLISTED",
        actorType: "system",
        actorId: "SECURITY_TRACKER",
        entityType: "attacker",
        entityId: ip,
        details: { reason },
      },
    });
  }
}
