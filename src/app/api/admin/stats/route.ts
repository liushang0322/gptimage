import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return Response.json({ error: "无权限" }, { status: 403 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    totalUsers,
    todayUsers,
    totalImages,
    todayImages,
    totalRevenue,
    pendingOrders,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.image.count({ where: { status: "COMPLETED" } }),
    prisma.image.count({ where: { status: "COMPLETED", createdAt: { gte: today } } }),
    prisma.order.aggregate({
      where: { status: "CONFIRMED" },
      _sum: { amount: true }
    }),
    prisma.order.count({ where: { status: "PENDING" } }),
  ])

  return Response.json({
    totalUsers,
    todayUsers,
    totalImages,
    todayImages,
    totalRevenue: totalRevenue._sum.amount || 0,
    pendingOrders,
  })
}
