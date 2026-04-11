import { auth } from "@clerk/nextjs";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const incident = await prisma.incident.update({
    where: { id: params.id },
    data: { 
      status: "resolved",
      resolvedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "incident_resolved",
      actorType: "user",
      actorId: userId,
      entityType: "incident",
      entityId: params.id,
    },
  });

  return NextResponse.json(incident);
}
