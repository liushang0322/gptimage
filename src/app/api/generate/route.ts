import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import OpenAI from "openai"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

let _openai: OpenAI | null = null
const openAIBaseURL = process.env.OPENAI_BASE_URL?.trim() || undefined
const openAIImageModel = process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-1"

function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: openAIBaseURL,
    })
  }
  return _openai
}

// 积分消耗规则
function calculateCreditCost(size: string, quality: string, count: number): number {
  let baseCost = 10 // 标准 1024x1024
  
  if (size === "1536x1536" || size === "1536x1024" || size === "1024x1536") {
    baseCost = 15
  }
  if (size === "2048x2048") {
    baseCost = 20
  }
  
  if (quality === "HD") {
    baseCost = Math.ceil(baseCost * 1.5)
  }
  
  // 第一张全价，额外的每张+8积分
  return baseCost + (count - 1) * 8
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return Response.json({ error: "未登录" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { prompt, size = "1024x1024", quality = "STANDARD", count = 1, mode = "TEXT_TO_IMAGE", referenceImage } = body

    if (!prompt || prompt.trim().length === 0) {
      return Response.json({ error: "请输入图片描述" }, { status: 400 })
    }

    if (count < 1 || count > 4) {
      return Response.json({ error: "生成数量必须在1-4之间" }, { status: 400 })
    }

    // 计算积分消耗
    const creditCost = calculateCreditCost(size, quality, count)

    // 检查用户积分
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    })

    if (!user || user.credits < creditCost) {
      return Response.json(
        { error: `积分不足，需要 ${creditCost} 积分，当前余额 ${user?.credits || 0} 积分` },
        { status: 402 }
      )
    }

    // 创建图片记录
    const imageRecord = await prisma.image.create({
      data: {
        userId,
        prompt,
        mode: mode === "IMAGE_TO_IMAGE" ? "IMAGE_TO_IMAGE" : "TEXT_TO_IMAGE",
        size,
        quality: quality === "HD" ? "HD" : "STANDARD",
        count,
        creditCost,
        status: "PROCESSING",
        referenceUrl: referenceImage || null,
      }
    })

    try {
      // 调用 OpenAI API 生成图片
      const imageUrls: string[] = []
      
      for (let i = 0; i < count; i++) {
        let response;
        
        if (mode === "IMAGE_TO_IMAGE" && referenceImage) {
          // 图生图 - 使用 edit endpoint
          // referenceImage 是 base64 数据
          const imageBuffer = Buffer.from(referenceImage.split(",")[1] || referenceImage, "base64")
          const imageFile = new File([imageBuffer], "reference.png", { type: "image/png" })
          
          response = await getOpenAI().images.edit({
            model: openAIImageModel,
            image: imageFile,
            prompt: prompt,
            size: size as any,
            quality: quality === "HD" ? "high" : "low",
          })
        } else {
          // 文生图
          response = await getOpenAI().images.generate({
            model: openAIImageModel,
            prompt: prompt,
            size: size as any,
            quality: quality === "HD" ? "high" : "low",
            n: 1,
          })
        }

        // 保存图片到本地
        if (response.data && response.data[0]) {
          const imageData = response.data[0]
          let savedPath: string

          if (imageData.b64_json) {
            // base64 格式
            const buffer = Buffer.from(imageData.b64_json, "base64")
            const fileName = `${imageRecord.id}_${i}_${Date.now()}.png`
            const uploadDir = path.join(process.cwd(), "public", "uploads", userId)
            await mkdir(uploadDir, { recursive: true })
            const filePath = path.join(uploadDir, fileName)
            await writeFile(filePath, buffer)
            savedPath = `/uploads/${userId}/${fileName}`
          } else if (imageData.url) {
            // URL 格式 - 下载并保存
            const imgResponse = await fetch(imageData.url)
            const buffer = Buffer.from(await imgResponse.arrayBuffer())
            const fileName = `${imageRecord.id}_${i}_${Date.now()}.png`
            const uploadDir = path.join(process.cwd(), "public", "uploads", userId)
            await mkdir(uploadDir, { recursive: true })
            const filePath = path.join(uploadDir, fileName)
            await writeFile(filePath, buffer)
            savedPath = `/uploads/${userId}/${fileName}`
          } else {
            throw new Error("No image data received")
          }

          imageUrls.push(savedPath)
        }
      }

      // 扣除积分
      await prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: creditCost } }
      })

      // 记录积分消耗
      await prisma.creditLog.create({
        data: {
          userId,
          amount: -creditCost,
          type: "CONSUME",
          description: `生成图片: ${prompt.substring(0, 50)}`,
          relatedId: imageRecord.id,
        }
      })

      // 更新图片记录
      await prisma.image.update({
        where: { id: imageRecord.id },
        data: {
          status: "COMPLETED",
          imageUrls,
        }
      })

      return Response.json({
        success: true,
        images: imageUrls,
        creditCost,
        remainingCredits: user.credits - creditCost,
      })

    } catch (apiError: any) {
      // API 调用失败，标记图片记录为失败
      await prisma.image.update({
        where: { id: imageRecord.id },
        data: { status: "FAILED" }
      })

      console.error("OpenAI API error:", apiError)
      return Response.json(
        {
          error:
            "图片生成失败: " +
            (apiError.message || "API调用出错") +
            (openAIBaseURL ? ` (当前代理: ${openAIBaseURL})` : ""),
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error("Generate error:", error)
    return Response.json(
      { error: "服务器错误，请稍后重试" },
      { status: 500 }
    )
  }
}
