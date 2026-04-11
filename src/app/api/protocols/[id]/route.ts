import { auth } from "@clerk/nextjs";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { encrypt } from "@/lib/crypto";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const { emergencyPrivateKey, ...rest } = body;

  if (emergencyPrivateKey) {
    const { encrypted, iv, tag } = encrypt(emergencyPrivateKey);
    await prisma.contract.updateMany({
      where: { protocolId: params.id },
      data: {
        encryptedEmergencyKey: encrypted,
        emergencyKeyIv: iv,
        emergencyKeyTag: tag,
      },
    });
  }

  const protocol = await prisma.protocol.update({
    where: { id: params.id },
    data: rest,
  });

  return NextResponse.json(protocol);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  // Delete associated data first
  await prisma.contract.deleteMany({ where: { protocolId: params.id } });
  await prisma.incident.deleteMany({ where: { protocolId: params.id } });
  await prisma.protocol.delete({ where: { id: params.id } });

  return new NextResponse(null, { status: 204 });
}
