import type { NextRequest } from "next/server";
import { tuneRecordings } from "@/lib/recordings";

/** Recordings of one tune, loaded when the map zooms into it. */
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/tunes/[slug]">) {
  const { slug } = await ctx.params;
  const found = tuneRecordings(slug);
  if (!found) return Response.json({ error: `Unknown tune: ${slug}` }, { status: 404 });
  return Response.json(found);
}
