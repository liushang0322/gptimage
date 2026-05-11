import { NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password) {
      return Response.json(
        { error: "邮箱和密码不能为空" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return Response.json(
        { error: "密码长度不能少于6位" },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return Response.json(
        { error: "该邮箱已注册" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split("@")[0],
        credits: 20, // 新用户赠送20积分
      }
    })

    // 记录赠送积分
    await prisma.creditLog.create({
      data: {
        userId: user.id,
        amount: 20,
        type: "GIFT",
        description: "新用户注册赠送",
      }
    })

    return Response.json(
      { message: "注册成功", user: { id: user.id, email: user.email, name: user.name } },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return Response.json(
      { error: "注册失败，请稍后重试" },
      { status: 500 }
    )
  }
}
