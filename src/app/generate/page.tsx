"use client"

import { useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/toast"
import { Sparkles, Upload, X, Download, RefreshCw, Image as ImageIcon } from "lucide-react"

const SIZE_OPTIONS = [
  { value: "1024x1024", label: "1024 x 1024 (方形)" },
  { value: "1536x1024", label: "1536 x 1024 (横版)" },
  { value: "1024x1536", label: "1024 x 1536 (竖版)" },
]

const QUALITY_OPTIONS = [
  { value: "STANDARD", label: "标准质量" },
  { value: "HD", label: "高清质量 (HD)" },
]

const COUNT_OPTIONS = [
  { value: "1", label: "1 张" },
  { value: "2", label: "2 张" },
  { value: "3", label: "3 张" },
  { value: "4", label: "4 张" },
]

function calculateCost(size: string, quality: string, count: number): number {
  let baseCost = 10
  if (size === "1536x1024" || size === "1024x1536" || size === "1536x1536") {
    baseCost = 15
  }
  if (quality === "HD") {
    baseCost = Math.ceil(baseCost * 1.5)
  }
  return baseCost + (count - 1) * 8
}

export default function GeneratePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { addToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [prompt, setPrompt] = useState("")
  const [size, setSize] = useState("1024x1024")
  const [quality, setQuality] = useState("STANDARD")
  const [count, setCount] = useState("1")
  const [mode, setMode] = useState<"TEXT_TO_IMAGE" | "IMAGE_TO_IMAGE">("TEXT_TO_IMAGE")
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [referencePreview, setReferencePreview] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [error, setError] = useState("")

  const estimatedCost = calculateCost(size, quality, parseInt(count))

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      addToast("图片大小不能超过10MB", "error")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setReferenceImage(reader.result as string)
      setReferencePreview(reader.result as string)
      setMode("IMAGE_TO_IMAGE")
    }
    reader.readAsDataURL(file)
  }

  const removeReferenceImage = () => {
    setReferenceImage(null)
    setReferencePreview(null)
    setMode("TEXT_TO_IMAGE")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      addToast("请输入图片描述", "error")
      return
    }

    setGenerating(true)
    setError("")
    setGeneratedImages([])

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          size,
          quality,
          count: parseInt(count),
          mode,
          referenceImage: referenceImage,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "生成失败")
        addToast(data.error || "生成失败", "error")
        return
      }

      setGeneratedImages(data.images)
      addToast(`生成成功！消耗 ${data.creditCost} 积分，剩余 ${data.remainingCredits} 积分`, "success")
    } catch (err) {
      setError("网络错误，请稍后重试")
      addToast("网络错误，请稍后重试", "error")
    } finally {
      setGenerating(false)
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
      addToast("下载失败", "error")
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        {/* Results Area */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            AI 图片生成
          </h1>

          {/* Generated Images */}
          <div className="min-h-[400px] rounded-xl border border-gray-700 bg-gray-800/30 p-6">
            {generating ? (
              <div className="flex flex-col items-center justify-center h-[400px]">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                </div>
                <p className="mt-6 text-gray-400">AI 正在创作中...</p>
                <p className="text-sm text-gray-500 mt-2">通常需要 10-30 秒</p>
              </div>
            ) : generatedImages.length > 0 ? (
              <div>
                <div className={`grid gap-4 ${generatedImages.length === 1 ? "grid-cols-1 max-w-lg mx-auto" : "grid-cols-2"}`}>
                  {generatedImages.map((img, idx) => (
                    <div key={idx} className="group relative rounded-lg overflow-hidden bg-gray-700">
                      <img src={img} alt={`Generated ${idx + 1}`} className="w-full aspect-square object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="sm" onClick={() => handleDownload(img, idx)}>
                          <Download className="w-4 h-4 mr-1" /> 下载
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-center">
                  <Button variant="outline" onClick={handleGenerate}>
                    <RefreshCw className="w-4 h-4 mr-2" /> 重新生成
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
                <ImageIcon className="w-16 h-16 mb-4 opacity-30" />
                <p>在右侧输入描述，开始生成图片</p>
              </div>
            )}

            {error && !generating && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Controls Sidebar */}
        <div className="space-y-4">
          {/* Mode Toggle */}
          <Card>
            <CardContent className="p-4">
              <div className="flex rounded-lg bg-gray-700/50 p-1">
                <button
                  onClick={() => { setMode("TEXT_TO_IMAGE"); removeReferenceImage(); }}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    mode === "TEXT_TO_IMAGE"
                      ? "bg-purple-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  文生图
                </button>
                <button
                  onClick={() => setMode("IMAGE_TO_IMAGE")}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    mode === "IMAGE_TO_IMAGE"
                      ? "bg-purple-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  图生图
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Reference Image Upload (for image-to-image) */}
          {mode === "IMAGE_TO_IMAGE" && (
            <Card>
              <CardContent className="p-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">参考图片</label>
                {referencePreview ? (
                  <div className="relative">
                    <img src={referencePreview} alt="Reference" className="w-full rounded-lg" />
                    <button
                      onClick={removeReferenceImage}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition-colors"
                  >
                    <Upload className="w-8 h-8 mx-auto text-gray-500 mb-2" />
                    <p className="text-sm text-gray-400">点击上传参考图片</p>
                    <p className="text-xs text-gray-500 mt-1">支持 PNG、JPG，最大 10MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </CardContent>
            </Card>
          )}

          {/* Prompt Input */}
          <Card>
            <CardContent className="p-4">
              <Textarea
                label="图片描述 (Prompt)"
                placeholder="描述你想要生成的图片，越详细越好..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <Select
                label="图片尺寸"
                options={SIZE_OPTIONS}
                value={size}
                onChange={(e) => setSize(e.target.value)}
              />
              <Select
                label="图片质量"
                options={QUALITY_OPTIONS}
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
              />
              <Select
                label="生成数量"
                options={COUNT_OPTIONS}
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Cost & Generate Button */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">预估消耗</span>
                <span className="text-lg font-bold text-purple-400">{estimatedCost} 积分</span>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={handleGenerate}
                loading={generating}
                disabled={!prompt.trim() || (mode === "IMAGE_TO_IMAGE" && !referenceImage)}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {generating ? "生成中..." : "开始生成"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
