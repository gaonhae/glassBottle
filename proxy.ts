import { userAgent, type NextRequest, NextResponse } from "next/server";

import { isSupportedDeviceType } from "@/lib/device";
import { updateSession } from "@/lib/supabase/middleware";

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });
}

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  if (pathname === "/unsupported-device") {
    return response;
  }

  const { device } = userAgent(request);
  if (isSupportedDeviceType(device.type)) {
    return response;
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/unsupported-device";
  redirectUrl.searchParams.set("from", pathname);

  const redirectResponse = NextResponse.redirect(redirectUrl);
  copyCookies(response, redirectResponse);
  return redirectResponse;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
};
