import { auth } from "@clerk/nextjs";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const { name, website, chains, subscriptionTier } = body;

  const protocol = await prisma.protocol.create({
    data: {
      userId: (await prisma.user.findUniqueOrThrow({ where: { clerkId: userId } })).id,
      name,
      website,
      chains,
      subscriptionTier,
      onboardingStep: 2,
    },
  });

  return NextResponse.json(protocol);
}
