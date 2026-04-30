import { validateContractOwnership } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { error } = await validateContractOwnership(params.id);
  if (error) return error;

  const metrics = await prisma.baselineMetric.findMany({
    where: { contractId: params.id },
  });

  return NextResponse.json(metrics);
}
