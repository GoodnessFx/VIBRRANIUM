import { validateProtocolOwnership } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { encrypt } from "@/lib/crypto";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error } = await validateProtocolOwnership(params.id);
  if (error) return error;

  const body = await req.json();
  const { emergencyPrivateKey, name, website, twitterHandle, telegramChatId, slackWebhookUrl, pagerdutyKey } = body;

  // Whitelist fields for update
  const updateData: Record<string, string | number | boolean> = {};
  if (name) updateData.name = name;
  if (website) updateData.website = website;
  if (twitterHandle) updateData.twitterHandle = twitterHandle;
  if (telegramChatId) updateData.telegramChatId = telegramChatId;
  if (slackWebhookUrl) {
    // Basic SSRF protection
    if (!slackWebhookUrl.startsWith("https://hooks.slack.com/")) {
      return new NextResponse("Invalid Slack Webhook URL", { status: 400 });
    }
    updateData.slackWebhookUrl = slackWebhookUrl;
  }
  if (pagerdutyKey) updateData.pagerdutyKey = pagerdutyKey;

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

  const updatedProtocol = await prisma.protocol.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json(updatedProtocol);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { error: deleteError } = await validateProtocolOwnership(params.id);
  if (deleteError) return deleteError;

  // Delete associated data first
  await prisma.contract.deleteMany({ where: { protocolId: params.id } });
  await prisma.incident.deleteMany({ where: { protocolId: params.id } });
  await prisma.protocol.delete({ where: { id: params.id } });

  return new NextResponse(null, { status: 204 });
}
