import { validateProtocolOwnership } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { protocolId: string } }) {
  const { error } = await validateProtocolOwnership(params.protocolId);
  if (error) return error;

  const protocol = await prisma.protocol.findUnique({
    where: { id: params.protocolId },
    include: {
      contracts: {
        include: {
          transactions: {
            orderBy: { timestamp: "desc" },
            take: 50,
          },
        },
      },
      incidents: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!protocol) return new NextResponse("Not Found", { status: 404 });

  // Basic stats
  const totalTvl = protocol.tvlUsd;
  const activeMonitors = protocol.contracts.length;
  const totalIncidents = protocol.incidents.length;
  const lastIncident = protocol.incidents[0] || null;

  return NextResponse.json({
    protocol,
    stats: {
      totalTvl,
      activeMonitors,
      totalIncidents,
      lastIncident,
    },
  });
}
