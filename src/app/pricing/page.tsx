"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import { CreditCard, Check, Sparkles } from "lucide-react"

const PACKAGES = [
  { id: "starter", name: "体验包", price: 9.9, credits: 100, perCredit: "0.099", popular: false },
  { id: "standard", name: "标准包", price: 29.9, credits: 350, perCredit: "0.085", popular: true },
  { id: "premium", name: "高级包", price: 59.9, credits: 800, perCredit: "0.075", popular: false },
  { id: "pro", name: "专业包", price: 99.9, credits: 1500, perCredit: "0.067", popular: false },
]

const COST_TABLE = [
  { name: "文生图 - 标准 (1024x1024)", cost: 10 },
  { name: "文生图 - 横版/竖版 (1536x1024)", cost: 15 },
  { name: "文生图 - 高清 (1024x1024 HD)", cost: 15 },
  { name: "文生图 - 高清横版/竖版 (HD)", cost: 23 },
  { name: "图生图 - 标准", cost: 10 },
  { name: "图生图 - 高清", cost: 15 },
  { name: "每额外生成 1 张", cost: 8 },
]

export default function PricingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { addToast } = useToast()
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handlePurchase = async (packageId: string) => {
    if (!session) {
      router.push("/login")
      return
    }

    setSelectedPackage(packageId)
    setLoading(true)

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      })

      const data = await res.json()
      if (!res.ok) {
        addToast(data.error || "创建订单失败", "error")
        return
      }

      // 跳转到支付页面
      router.push(`/pay?orderId=${data.order.id}`)
    } catch (err) {
      addToast("网络错误，请稍后重试", "error")
    } finally {
      setLoading(false)
      setSelectedPackage(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-white mb-3">充值积分</h1>
        <p className="text-gray-400">选择适合你的积分包，按需使用</p>
      </div>

      {/* Packages */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
        {PACKAGES.map((pkg) => (
          <Card key={pkg.id} className={`relative ${pkg.popular ? "border-purple-500 ring-1 ring-purple-500" : ""}`}>
            {pkg.popular && (
              <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2" variant="default">
                最受欢迎
              </Badge>
            )}
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-white mb-1">{pkg.name}</h3>
              <div className="my-4">
                <span className="text-3xl font-bold text-white">¥{pkg.price}</span>
              </div>
              <p className="text-2xl font-bold text-purple-400 mb-1">{pkg.credits} 积分</p>
              <p className="text-xs text-gray-500 mb-6">约 ¥{pkg.perCredit}/积分</p>
              
              <Button
                className="w-full"
                variant={pkg.popular ? "default" : "outline"}
                onClick={() => handlePurchase(pkg.id)}
                loading={loading && selectedPackage === pkg.id}
              >
                立即充值
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cost Table */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-white mb-6 text-center">积分消耗规则</h2>
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-4 text-sm font-medium text-gray-400">操作</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-400">消耗积分</th>
                </tr>
              </thead>
              <tbody>
                {COST_TABLE.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-700/50 last:border-0">
                    <td className="p-4 text-sm text-gray-300">{item.name}</td>
                    <td className="p-4 text-sm text-right text-purple-400 font-medium">{item.cost} 积分</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
