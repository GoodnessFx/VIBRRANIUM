import { auth } from "@clerk/nextjs";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { AlertService } from "@/services/alert-service";

const alertService = new AlertService();

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const { protocolId } = body;

  const protocol = await prisma.protocol.findUnique({
    where: { id: protocolId },
  });

  if (!protocol) return new NextResponse("Protocol not found", { status: 404 });

  const testIncident = {
    id: "test-incident",
    type: "TEST_ALERT",
    txHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    responseTimeMs: 0,
    contractId: "test-contract",
    status: "active",
  };

  try {
    await alertService.sendAlert(testIncident, protocol);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Test alert failed:", error);
    return new NextResponse("Failed to send test alert", { status: 500 });
  }
}
