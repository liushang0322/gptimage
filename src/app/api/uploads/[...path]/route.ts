import { NextRequest } from "next/server"
import { readFile } from "fs/promises"
import path from "path"

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
}

type RouteContext = {
  params: Promise<{
    path: string[]
  }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const params = await context.params
  const pathParts = params.path?.filter(Boolean) || []

  if (pathParts.length < 2) {
    return Response.json({ error: "图片路径无效" }, { status: 400 })
  }

  const uploadsRoot = path.join(process.cwd(), "public", "uploads")
  const resolvedPath = path.resolve(uploadsRoot, ...pathParts)

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
        "Content-Length": String(fileBuffer.length),
        "Content-Disposition": `inline; filename="${path.basename(resolvedPath)}"`,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    })
  } catch {
    return Response.json({ error: "图片不存在" }, { status: 404 })
  }
}

