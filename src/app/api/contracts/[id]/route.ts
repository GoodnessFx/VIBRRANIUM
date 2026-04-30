import { validateContractOwnership } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { error } = await validateContractOwnership(params.id);
  if (error) return error;

  await prisma.contract.delete({ where: { id: params.id } });

  return new NextResponse(null, { status: 204 });
}
