import { auth } from "@clerk/nextjs";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { encrypt } from "@/lib/crypto";

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const { protocolId, address, chain, name, abi, privateKey } = body;

  let encryptedKeyData = {};
  if (privateKey) {
    const { encrypted, iv, tag } = encrypt(privateKey);
    encryptedKeyData = {
      encryptedEmergencyKey: encrypted,
      emergencyKeyIv: iv,
      emergencyKeyTag: tag,
    };
  }

  const contract = await prisma.contract.create({
    data: {
      protocolId,
      address: address.toLowerCase(),
      chain,
      name,
      abi,
      ...encryptedKeyData,
    },
  });

  return NextResponse.json(contract);
}
