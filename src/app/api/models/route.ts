import { NextRequest, NextResponse } from "next/server";
import { getCatalogModels } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const provider = searchParams.get("provider") || undefined;
  const category = searchParams.get("category") || undefined;
  const freeTierStatus = searchParams.get("freeTierStatus") || undefined;
  const search = searchParams.get("search") || undefined;
  const sort = searchParams.get("sort") || undefined;

  const models = await getCatalogModels({
    provider,
    category,
    freeTierStatus,
    search,
    sort,
  });

  return NextResponse.json({
    models,
    total: models.length,
    filters: { provider, category, freeTierStatus, search, sort },
  });
}
