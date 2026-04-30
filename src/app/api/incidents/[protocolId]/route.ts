import { validateProtocolOwnership } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { protocolId: string } }) {
  const { error } = await validateProtocolOwnership(params.protocolId);
  if (error) return error;

  const incidents = await prisma.incident.findMany({
    where: { protocolId: params.protocolId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(incidents);
}
