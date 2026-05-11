"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { Download, Image as ImageIcon, ChevronLeft, ChevronRight, X } from "lucide-react"

export default function GalleryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [images, setImages] = useState<any[]>([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<any>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchImages(1)
    }
  }, [session])

  const fetchImages = async (page: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/images?page=${page}&limit=12`)
      const data = await res.json()
      setImages(data.images || [])
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 })
    } catch (err) {
      console.error("Failed to fetch images:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `gptimage_${Date.now()}_${index}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch {
      console.error("Download failed")
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-blue-400" />
          我的图库
        </h1>
        <p className="text-sm text-gray-400">共 {pagination.total} 张图片</p>
      </div>

      {images.length === 0 ? (
        <div className="text-center py-20">
          <ImageIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 mb-4">还没有生成过图片</p>
          <Button onClick={() => router.push("/generate")}>开始生成</Button>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {images.map((image: any) => (
              <Card key={image.id} className="overflow-hidden group cursor-pointer" onClick={() => setSelectedImage(image)}>
                <div className="relative aspect-square bg-gray-700">
                  {image.imageUrls?.[0] && (
                    <img
                      src={image.imageUrls[0]}
                      alt={image.prompt}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {image.imageUrls?.length > 1 && (
                    <Badge className="absolute top-2 right-2" variant="info">
                      {image.imageUrls.length} 张
                    </Badge>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <div className="w-full">
                      <p className="text-white text-sm line-clamp-2">{image.prompt}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-300">{image.size} · {image.quality === "HD" ? "高清" : "标准"}</span>
                        <span className="text-xs text-gray-300">{formatDate(image.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchImages(pagination.page - 1)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> 上一页
              </Button>
              <span className="text-sm text-gray-400">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchImages(pagination.page + 1)}
              >
                下一页 <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Image Detail Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">图片详情</h3>
              <button onClick={() => setSelectedImage(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className={`grid gap-4 ${selectedImage.imageUrls?.length === 1 ? "" : "grid-cols-2"}`}>
                {selectedImage.imageUrls?.map((url: string, idx: number) => (
                  <div key={idx} className="relative group">
                    <img src={url} alt={`Image ${idx + 1}`} className="w-full rounded-lg" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Button size="sm" onClick={() => handleDownload(url, idx)}>
                        <Download className="w-4 h-4 mr-1" /> 下载
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-300"><span className="text-gray-500">描述：</span>{selectedImage.prompt}</p>
                <div className="flex gap-4 text-sm text-gray-400">
                  <span>尺寸: {selectedImage.size}</span>
                  <span>质量: {selectedImage.quality === "HD" ? "高清" : "标准"}</span>
                  <span>消耗: {selectedImage.creditCost} 积分</span>
                </div>
                <p className="text-xs text-gray-500">{formatDate(selectedImage.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
