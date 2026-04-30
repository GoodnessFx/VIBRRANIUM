import { validateContractOwnership } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { contractId: string } }) {
  const { error } = await validateContractOwnership(params.contractId);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  const transactions = await prisma.transaction.findMany({
    where: { contractId: params.contractId },
    orderBy: { timestamp: "desc" },
    skip,
    take: limit,
  });

  return NextResponse.json(transactions);
}
