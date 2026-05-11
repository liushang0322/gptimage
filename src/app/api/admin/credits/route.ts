import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return Response.json({ error: "无权限" }, { status: 403 })
  }

  const { userId, amount, description } = await request.json()

  if (!userId || !amount || amount === 0) {
    return Response.json({ error: "参数错误" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    return Response.json({ error: "用户不存在" }, { status: 404 })
  }

  if (user.credits + amount < 0) {
    return Response.json({ error: "扣除后积分不能为负" }, { status: 400 })
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } }
    }),
    prisma.creditLog.create({
      data: {
        userId,
        amount,
        type: "ADMIN_ADJUST",
        description: description || `管理员调整: ${amount > 0 ? "+" : ""}${amount}积分`,
      }
    })
  ])

  return Response.json({ success: true })
}
