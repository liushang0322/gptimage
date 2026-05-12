import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { normalizeStoredUploadPath } from "@/lib/upload-urls"
import { readFile } from "fs/promises"
import path from "path"

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  const rawPath = request.nextUrl.searchParams.get("path")
  if (!rawPath) {
    return Response.json({ error: "缺少图片路径" }, { status: 400 })
  }

  const relativePath = normalizeStoredUploadPath(rawPath)
  const pathParts = relativePath.split("/").filter(Boolean)

  if (pathParts.length < 2) {
    return Response.json({ error: "图片路径无效" }, { status: 400 })
  }

  const ownerId = pathParts[0]
  const user = session.user as { id: string; role?: string }

  if (user.role !== "ADMIN" && ownerId !== user.id) {
    return Response.json({ error: "无权限访问该图片" }, { status: 403 })
  }

  const uploadsRoot = path.join(process.cwd(), "public", "uploads")
  const resolvedPath = path.resolve(uploadsRoot, relativePath)

  if (!resolvedPath.startsWith(uploadsRoot + path.sep)) {
    return Response.json({ error: "图片路径非法" }, { status: 400 })
  }

  try {
    const fileBuffer = await readFile(resolvedPath)
    const ext = path.extname(resolvedPath).toLowerCase()
    const contentType = MIME_TYPES[ext] || "application/octet-stream"

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=86400",
      },
    })
  } catch {
    return Response.json({ error: "图片不存在" }, { status: 404 })
  }
}

