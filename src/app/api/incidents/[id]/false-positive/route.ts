import { auth } from "@clerk/nextjs";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const { reason } = body;

  const incident = await prisma.incident.update({
    where: { id: params.id },
    data: { 
      status: "resolved", // Assuming resolve on false positive
      resolvedAt: new Date(),
    },
  });

  // Adjust thresholds for the specific exploit type
  const thresholdOverride = await prisma.thresholdOverride.upsert({
    where: { 
      protocolId_exploitType: { 
        protocolId: incident.protocolId, 
        exploitType: incident.type 
      } 
    },
    update: { 
      threshold: { increment: 5 }, // Increment threshold to make it less sensitive
      adjustedAt: new Date(),
      adjustedReason: reason || "manual_false_positive",
    },
    create: {
      protocolId: incident.protocolId,
      exploitType: incident.type,
      threshold: 95, // Start from default + increment or high value
      adjustedReason: reason || "manual_false_positive",
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "false_positive_marked",
      actorType: "user",
      actorId: userId,
      entityType: "incident",
      entityId: params.id,
      details: { thresholdOverride },
    },
  });

  return NextResponse.json({ incident, thresholdOverride });
}
