"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Image, CreditCard, ShoppingCart } from "lucide-react"

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(r => r.json())
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="animate-pulse text-gray-400">加载中...</div>
  }

  const statCards = [
    { label: "总用户数", value: stats?.totalUsers || 0, today: stats?.todayUsers || 0, icon: Users, color: "purple" },
    { label: "生成图片", value: stats?.totalImages || 0, today: stats?.todayImages || 0, icon: Image, color: "blue" },
    { label: "总收入", value: `¥${stats?.totalRevenue || 0}`, today: null, icon: CreditCard, color: "green" },
    { label: "待确认订单", value: stats?.pendingOrders || 0, today: null, icon: ShoppingCart, color: "yellow" },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">管理后台</h1>
      
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  {stat.today !== null && (
                    <p className="text-xs text-gray-500 mt-1">今日 +{stat.today}</p>
                  )}
                </div>
                <stat.icon className={`w-8 h-8 text-${stat.color}-400 opacity-50`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
