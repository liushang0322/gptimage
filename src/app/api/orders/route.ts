import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// 充值包定义
const PACKAGES = [
  { id: "starter", name: "体验包", price: 9.9, credits: 100 },
  { id: "standard", name: "标准包", price: 29.9, credits: 350 },
  { id: "premium", name: "高级包", price: 59.9, credits: 800 },
  { id: "pro", name: "专业包", price: 99.9, credits: 1500 },
]

// 创建订单
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  const userId = (session.user as any).id
  const { packageId } = await request.json()

  const pkg = PACKAGES.find(p => p.id === packageId)
  if (!pkg) {
    return Response.json({ error: "无效的充值包" }, { status: 400 })
  }

  const order = await prisma.order.create({
    data: {
      userId,
      amount: pkg.price,
      credits: pkg.credits,
      packageName: pkg.name,
      status: "PENDING",
    }
  })

  return Response.json({ order, package: pkg })
}

// 获取用户订单列表
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  const userId = (session.user as any).id
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })

  return Response.json({ orders })
}
