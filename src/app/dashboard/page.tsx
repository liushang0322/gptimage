"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatCredits } from "@/lib/utils"
import { Sparkles, Image, CreditCard, ArrowRight } from "lucide-react"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [recentImages, setRecentImages] = useState<any[]>([])
  const [recentLogs, setRecentLogs] = useState<any[]>([])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetch("/api/user").then(r => r.json()).then(setUser)
      fetch("/api/images?limit=4").then(r => r.json()).then(d => setRecentImages(d.images || []))
      fetch("/api/user/credits?limit=5").then(r => r.json()).then(d => setRecentLogs(d.logs || []))
    }
  }, [session])

  if (status === "loading" || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">个人中心</h1>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">积分余额</p>
                <p className="text-3xl font-bold text-white mt-1">{formatCredits(user.credits)}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <Link href="/pricing" className="mt-3 inline-flex items-center text-sm text-purple-400 hover:text-purple-300">
              充值 <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">生成图片</p>
                <p className="text-3xl font-bold text-white mt-1">{recentImages.length}+</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Image className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <Link href="/gallery" className="mt-3 inline-flex items-center text-sm text-blue-400 hover:text-blue-300">
              查看图库 <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">账号等级</p>
                <p className="text-3xl font-bold text-white mt-1">{user.role === "ADMIN" ? "管理员" : "普通用户"}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Images */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">最近生成</CardTitle>
              <Link href="/gallery">
                <Button variant="ghost" size="sm">查看全部</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {recentImages.map((img: any) => (
                  <div key={img.id} className="aspect-square rounded-lg overflow-hidden bg-gray-700">
                    {img.imageUrls?.[0] && (
                      <img src={img.imageUrls[0]} alt={img.prompt} className="w-full h-full object-cover" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">还没有生成过图片</p>
            )}
          </CardContent>
        </Card>

        {/* Credit Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">积分记录</CardTitle>
          </CardHeader>
          <CardContent>
            {recentLogs.length > 0 ? (
              <div className="space-y-3">
                {recentLogs.map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-700/50 last:border-0">
                    <div>
                      <p className="text-sm text-white">{log.description}</p>
                      <p className="text-xs text-gray-500">{formatDate(log.createdAt)}</p>
                    </div>
                    <span className={`text-sm font-medium ${log.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                      {log.amount > 0 ? "+" : ""}{log.amount}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">暂无记录</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
