import { validateIncidentOwnership } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { user, error } = await validateIncidentOwnership(params.id);
  if (error) return error;

  const updatedIncident = await prisma.incident.update({
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
      actorId: user!.id,
      entityType: "incident",
      entityId: params.id,
    },
  });

  return NextResponse.json(updatedIncident);
}
