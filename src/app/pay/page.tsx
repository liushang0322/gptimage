"use client"

import { Suspense, useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import { CheckCircle, Clock, QrCode } from "lucide-react"

function PayContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToast } = useToast()
  const orderId = searchParams.get("orderId")
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session && orderId) {
      fetchOrder()
    }
  }, [session, orderId])

  const fetchOrder = async () => {
    try {
      const res = await fetch("/api/orders")
      const data = await res.json()
      const found = data.orders?.find((o: any) => o.id === orderId)
      if (found) {
        setOrder(found)
      }
    } catch (err) {
      console.error("Failed to fetch order:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">加载中...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">订单不存在</p>
          <Button onClick={() => router.push("/pricing")}>返回充值页</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6 text-center">支付充值</h1>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400">订单编号</span>
            <span className="text-sm text-gray-300 font-mono">{order.id.slice(0, 12)}...</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400">充值包</span>
            <span className="text-white font-medium">{order.packageName}</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400">获得积分</span>
            <span className="text-purple-400 font-bold">{order.credits} 积分</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400">应付金额</span>
            <span className="text-2xl font-bold text-white">¥{order.amount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">订单状态</span>
            {order.status === "PENDING" ? (
              <Badge variant="warning">待支付</Badge>
            ) : order.status === "CONFIRMED" ? (
              <Badge variant="success">已完成</Badge>
            ) : (
              <Badge variant="danger">已拒绝</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {order.status === "PENDING" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-center">支付宝扫码支付</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center">
              {/* 支付宝收款码占位 */}
              <div className="w-48 h-48 mx-auto bg-gray-700 rounded-lg flex items-center justify-center mb-4 border-2 border-dashed border-gray-600">
                <div className="text-center">
                  <QrCode className="w-12 h-12 mx-auto text-gray-500 mb-2" />
                  <p className="text-xs text-gray-500">收款码</p>
                </div>
              </div>
              
              <div className="space-y-3 text-sm text-gray-400">
                <p className="font-medium text-white">支付步骤：</p>
                <ol className="text-left space-y-2 pl-4">
                  <li>1. 打开支付宝扫描上方二维码</li>
                  <li>2. 付款金额填写 <span className="text-white font-bold">¥{order.amount}</span></li>
                  <li>3. 备注填写订单号：<span className="text-purple-400 font-mono text-xs">{order.id.slice(0, 8)}</span></li>
                  <li>4. 支付完成后等待管理员确认（通常5分钟内）</li>
                </ol>
              </div>

              <div className="mt-6 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-center gap-2 text-yellow-400 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>支付后请耐心等待确认，积分将自动到账</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {order.status === "CONFIRMED" && (
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
            <p className="text-lg font-semibold text-white mb-2">支付成功！</p>
            <p className="text-gray-400 mb-6">{order.credits} 积分已到账</p>
            <Button onClick={() => router.push("/generate")}>去生成图片</Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-4 text-center">
        <Button variant="ghost" onClick={() => router.push("/dashboard")}>返回个人中心</Button>
      </div>
    </div>
  )
}

export default function PayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-gray-400">加载中...</div></div>}>
      <PayContent />
    </Suspense>
  )
}
