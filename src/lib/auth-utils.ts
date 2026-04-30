import { auth } from "@clerk/nextjs";
import prisma from "./prisma";
import { NextResponse } from "next/server";

export async function getAuthUser() {
  const { userId: clerkId } = auth();
  if (!clerkId) return null;

  const user = await prisma.user.findUnique({
    where: { clerkId },
  });

  return user;
}

export async function validateProtocolOwnership(protocolId: string) {
  const user = await getAuthUser();
  if (!user) return { error: new NextResponse("Unauthorized", { status: 401 }), user: null };

  const protocol = await prisma.protocol.findFirst({
    where: {
      id: protocolId,
      userId: user.id,
    },
  });

  if (!protocol) {
    return { error: new NextResponse("Forbidden", { status: 403 }), user: null };
  }

  return { protocol, user, error: null };
}

export async function validateContractOwnership(contractId: string) {
  const user = await getAuthUser();
  if (!user) return { error: new NextResponse("Unauthorized", { status: 401 }), user: null };

  const contract = await prisma.contract.findFirst({
    where: {
      id: contractId,
      protocol: {
        userId: user.id,
      },
    },
    include: {
      protocol: true,
    },
  });

  if (!contract) {
    return { error: new NextResponse("Forbidden", { status: 403 }), user: null };
  }

  return { contract, user, error: null };
}

export async function validateIncidentOwnership(incidentId: string) {
  const user = await getAuthUser();
  if (!user) return { error: new NextResponse("Unauthorized", { status: 401 }), user: null };

  const incident = await prisma.incident.findFirst({
    where: {
      id: incidentId,
      protocol: {
        userId: user.id,
      },
    },
    include: {
      protocol: true,
    },
  });

  if (!incident) {
    return { error: new NextResponse("Forbidden", { status: 403 }), user: null };
  }

  return { incident, user, error: null };
}

export async function validateReportOwnership(reportId: string) {
  const user = await getAuthUser();
  if (!user) return { error: new NextResponse("Unauthorized", { status: 401 }), user: null };

  const report = await prisma.monthlyReport.findFirst({
    where: {
      id: reportId,
      protocol: {
        userId: user.id,
      },
    },
    include: {
      protocol: true,
    },
  });

  if (!report) {
    return { error: new NextResponse("Forbidden", { status: 403 }), user: null };
  }

  return { report, user, error: null };
}
