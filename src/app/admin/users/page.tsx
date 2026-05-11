"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import { formatDate } from "@/lib/utils"
import { Search, Plus, Minus } from "lucide-react"

export default function AdminUsersPage() {
  const { addToast } = useToast()
  const [users, setUsers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [creditModal, setCreditModal] = useState<{ userId: string; name: string } | null>(null)
  const [creditAmount, setCreditAmount] = useState("")
  const [creditDesc, setCreditDesc] = useState("")

  const fetchUsers = async (p: number = 1, s: string = "") => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users?page=${p}&search=${encodeURIComponent(s)}`)
      const data = await res.json()
      setUsers(data.users || [])
      setTotal(data.total || 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleSearch = () => {
    setPage(1)
    fetchUsers(1, search)
  }

  const handleAdjustCredits = async () => {
    if (!creditModal || !creditAmount) return
    
    try {
      const res = await fetch("/api/admin/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: creditModal.userId,
          amount: parseInt(creditAmount),
          description: creditDesc,
        }),
      })
      
      if (res.ok) {
        addToast("积分调整成功", "success")
        setCreditModal(null)
        setCreditAmount("")
        setCreditDesc("")
        fetchUsers(page, search)
      } else {
        const data = await res.json()
        addToast(data.error || "操作失败", "error")
      }
    } catch {
      addToast("网络错误", "error")
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">用户管理</h1>

      {/* Search */}
      <div className="flex gap-2 mb-6">
        <Input
          placeholder="搜索邮箱或昵称"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button onClick={handleSearch} variant="secondary">
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-800/50">
                <th className="text-left p-3 text-gray-400 font-medium">用户</th>
                <th className="text-left p-3 text-gray-400 font-medium">积分</th>
                <th className="text-left p-3 text-gray-400 font-medium">角色</th>
                <th className="text-left p-3 text-gray-400 font-medium">生成数</th>
                <th className="text-left p-3 text-gray-400 font-medium">注册时间</th>
                <th className="text-right p-3 text-gray-400 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-700/50">
                  <td className="p-3">
                    <div>
                      <p className="text-white">{user.name || "未命名"}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="p-3 text-purple-400 font-medium">{user.credits}</td>
                  <td className="p-3">
                    <Badge variant={user.role === "ADMIN" ? "default" : "info"}>
                      {user.role === "ADMIN" ? "管理员" : "用户"}
                    </Badge>
                  </td>
                  <td className="p-3 text-gray-300">{user._count?.images || 0}</td>
                  <td className="p-3 text-gray-400 text-xs">{formatDate(user.createdAt)}</td>
                  <td className="p-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setCreditModal({ userId: user.id, name: user.name || user.email })}
                    >
                      调整积分
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Credit Adjustment Modal */}
      {creditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                调整积分 - {creditModal.name}
              </h3>
              <div className="space-y-4">
                <Input
                  label="积分数量（正数增加，负数扣除）"
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="例如：100 或 -50"
                />
                <Input
                  label="备注（选填）"
                  value={creditDesc}
                  onChange={(e) => setCreditDesc(e.target.value)}
                  placeholder="调整原因"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setCreditModal(null)} className="flex-1">
                  取消
                </Button>
                <Button onClick={handleAdjustCredits} className="flex-1">
                  确认
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
