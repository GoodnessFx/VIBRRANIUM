import { validateReportOwnership } from "@/lib/auth-utils";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { report, error } = await validateReportOwnership(params.id);
  if (error) return error;

  // Return report info or presigned URL
  return NextResponse.json({ url: report.pdfUrl });
}
