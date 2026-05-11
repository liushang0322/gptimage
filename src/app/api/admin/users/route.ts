import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return Response.json({ error: "无权限" }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")
  const search = searchParams.get("search") || ""
  const skip = (page - 1) * limit

  const where = search ? {
    OR: [
      { email: { contains: search } },
      { name: { contains: search } },
    ]
  } : {}

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        credits: true,
        role: true,
        createdAt: true,
        _count: { select: { images: true, orders: true } }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where })
  ])

  return Response.json({ users, total, page, limit })
}
