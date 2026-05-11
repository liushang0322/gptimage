import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check which paths need auth
  const protectedPaths = ["/generate", "/gallery", "/dashboard", "/pay", "/admin"]
  const isProtected = protectedPaths.some(p => pathname.startsWith(p))

  if (isProtected) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
      const signInUrl = new URL("/login", request.url)
      signInUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(signInUrl)
    }

    // Admin routes protection
    if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/generate/:path*", "/gallery/:path*", "/dashboard/:path*", "/pay/:path*", "/admin/:path*"],
}
