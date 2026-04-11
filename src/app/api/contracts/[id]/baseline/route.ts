import { auth } from "@clerk/nextjs";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const metrics = await prisma.baselineMetric.findMany({
    where: { contractId: params.id },
  });

  return NextResponse.json(metrics);
}
