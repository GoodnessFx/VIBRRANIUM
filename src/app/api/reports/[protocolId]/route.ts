import { auth } from "@clerk/nextjs";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { protocolId: string } }) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const reports = await prisma.monthlyReport.findMany({
    where: { protocolId: params.protocolId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reports);
}
