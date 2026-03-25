import { userAgent, type NextRequest, NextResponse } from "next/server";

import { getDeviceRedirect } from "@/lib/device";
import { updateSession } from "@/lib/supabase/middleware";

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });
}

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);
  const pathname = request.nextUrl.pathname;
  const { device } = userAgent(request);
  const deviceRedirect = getDeviceRedirect(pathname, device.type);

  if (!deviceRedirect) {
    return response;
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = deviceRedirect.pathname;

  if (deviceRedirect.pathname === "/unsupported-device") {
    redirectUrl.searchParams.set("from", deviceRedirect.from);
  } else {
    redirectUrl.search = "";
  }

  const redirectResponse = NextResponse.redirect(redirectUrl);
  copyCookies(response, redirectResponse);
  return redirectResponse;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
};
