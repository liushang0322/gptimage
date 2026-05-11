import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  const userId = (session.user as any).id
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")
  const skip = (page - 1) * limit

  const [images, total] = await Promise.all([
    prisma.image.findMany({
      where: { userId, status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.image.count({
      where: { userId, status: "COMPLETED" }
    })
  ])

  return Response.json({
    images,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }
  })
}
