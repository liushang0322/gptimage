import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      credits: true,
      role: true,
      createdAt: true,
    }
  })

  if (!user) {
    return Response.json({ error: "用户不存在" }, { status: 404 })
  }

  return Response.json(user)
}
