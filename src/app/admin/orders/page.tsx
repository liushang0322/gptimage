"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import { formatDate } from "@/lib/utils"
import { Check, X } from "lucide-react"

export default function AdminOrdersPage() {
  const { addToast } = useToast()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchOrders = async (status: string = "") => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders?status=${status}`)
      const data = await res.json()
      setOrders(data.orders || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders() }, [])

  const handleAction = async (orderId: string, action: "confirm" | "reject") => {
    setActionLoading(orderId)
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action }),
      })

      if (res.ok) {
        addToast(action === "confirm" ? "订单已确认，积分已充值" : "订单已拒绝", "success")
        fetchOrders(filter)
      } else {
        const data = await res.json()
        addToast(data.error || "操作失败", "error")
      }
    } catch {
      addToast("网络错误", "error")
    } finally {
      setActionLoading(null)
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <Badge variant="warning">待确认</Badge>
      case "CONFIRMED": return <Badge variant="success">已确认</Badge>
      case "REJECTED": return <Badge variant="danger">已拒绝</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">订单管理</h1>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {[
          { value: "", label: "全部" },
          { value: "PENDING", label: "待确认" },
          { value: "CONFIRMED", label: "已确认" },
          { value: "REJECTED", label: "已拒绝" },
        ].map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => { setFilter(f.value); fetchOrders(f.value); }}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-800/50">
                <th className="text-left p-3 text-gray-400 font-medium">用户</th>
                <th className="text-left p-3 text-gray-400 font-medium">充值包</th>
                <th className="text-left p-3 text-gray-400 font-medium">金额</th>
                <th className="text-left p-3 text-gray-400 font-medium">积分</th>
                <th className="text-left p-3 text-gray-400 font-medium">状态</th>
                <th className="text-left p-3 text-gray-400 font-medium">时间</th>
                <th className="text-right p-3 text-gray-400 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-700/50">
                  <td className="p-3">
                    <p className="text-white">{order.user?.name || "未命名"}</p>
                    <p className="text-xs text-gray-500">{order.user?.email}</p>
                  </td>
                  <td className="p-3 text-gray-300">{order.packageName}</td>
                  <td className="p-3 text-white font-medium">¥{order.amount}</td>
                  <td className="p-3 text-purple-400">{order.credits}</td>
                  <td className="p-3">{statusBadge(order.status)}</td>
                  <td className="p-3 text-gray-400 text-xs">{formatDate(order.createdAt)}</td>
                  <td className="p-3 text-right">
                    {order.status === "PENDING" && (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-green-400 hover:text-green-300"
                          onClick={() => handleAction(order.id, "confirm")}
                          loading={actionLoading === order.id}
                        >
                          <Check className="w-4 h-4 mr-1" /> 确认
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300"
                          onClick={() => handleAction(order.id, "reject")}
                          loading={actionLoading === order.id}
                        >
                          <X className="w-4 h-4 mr-1" /> 拒绝
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">暂无订单</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
