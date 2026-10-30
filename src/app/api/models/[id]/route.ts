import { NextRequest, NextResponse } from "next/server";
import { getModelByIdOrSlug } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const model = await getModelByIdOrSlug(params.id);
  if (!model) {
    return NextResponse.json({ error: "Model not found" }, { status: 404 });
  }

  return NextResponse.json({ model });
}
