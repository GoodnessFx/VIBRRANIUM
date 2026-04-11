import { auth } from "@clerk/nextjs";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const report = await prisma.monthlyReport.findUnique({
    where: { id: params.id },
  });

  if (!report) return new NextResponse("Not Found", { status: 404 });

  // Return report info or presigned URL
  return NextResponse.json({ url: report.pdfUrl });
}
