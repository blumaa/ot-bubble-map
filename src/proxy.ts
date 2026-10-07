import type { NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/proxy";

export function proxy(request: NextRequest) {
  return updateSession(request);
}

// Only the admin area has sessions; the map itself stays fully static.
export const config = {
  matcher: ["/admin/:path*", "/auth/:path*"],
};
