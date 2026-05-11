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
  const status = searchParams.get("status") || ""
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")
  const skip = (page - 1) * limit

  const where = status ? { status: status as any } : {}

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { user: { select: { email: true, name: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.order.count({ where })
  ])

  return Response.json({ orders, total, page, limit })
}

// 确认订单
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return Response.json({ error: "无权限" }, { status: 403 })
  }

  const { orderId, action } = await request.json()

  if (!orderId || !["confirm", "reject"].includes(action)) {
    return Response.json({ error: "参数错误" }, { status: 400 })
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId }
  })

  if (!order || order.status !== "PENDING") {
    return Response.json({ error: "订单不存在或已处理" }, { status: 400 })
  }

  if (action === "confirm") {
    // 确认订单：充值积分
    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: {
          status: "CONFIRMED",
          confirmedAt: new Date(),
          confirmedBy: (session.user as any).id,
        }
      }),
      prisma.user.update({
        where: { id: order.userId },
        data: { credits: { increment: order.credits } }
      }),
      prisma.creditLog.create({
        data: {
          userId: order.userId,
          amount: order.credits,
          type: "RECHARGE",
          description: `充值${order.packageName}: +${order.credits}积分`,
          relatedId: orderId,
        }
      })
    ])
  } else {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "REJECTED" }
    })
  }

  return Response.json({ success: true })
}
