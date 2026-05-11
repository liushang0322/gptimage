import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, Zap, Shield, Image } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-900 to-blue-900/20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm mb-8">
              <Sparkles className="w-4 h-4" />
              <span>基于 GPT Image 2 模型</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6 leading-tight">
              AI 驱动的
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"> 图片生成 </span>
              平台
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
              输入文字描述，即刻获得高质量AI生成图片。支持文生图、图生图，
              多种尺寸和风格可选。
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  <Sparkles className="w-5 h-5 mr-2" />
                  免费体验
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  查看定价
                </Button>
              </Link>
            </div>
            
            <p className="mt-4 text-sm text-gray-500">新用户注册即送 20 积分，可免费生成 2 张图片</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-white mb-12">核心功能</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-gray-700 bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">文字生成图片</h3>
              <p className="text-gray-400 text-sm">输入文字描述，AI自动生成高质量图片，支持中英文提示词</p>
            </div>
            
            <div className="p-6 rounded-xl border border-gray-700 bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
                <Image className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">图片生成图片</h3>
              <p className="text-gray-400 text-sm">上传参考图片+文字描述，生成风格一致的变体图片</p>
            </div>
            
            <div className="p-6 rounded-xl border border-gray-700 bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">灵活参数设置</h3>
              <p className="text-gray-400 text-sm">自定义图片尺寸、质量、数量，满足不同场景需求</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">简单透明的定价</h2>
          <p className="text-gray-400 mb-8">按需充值，用多少付多少</p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { name: "体验包", price: "9.9", credits: "100" },
              { name: "标准包", price: "29.9", credits: "350" },
              { name: "高级包", price: "59.9", credits: "800" },
              { name: "专业包", price: "99.9", credits: "1500" },
            ].map((pkg) => (
              <div key={pkg.name} className="p-5 rounded-xl border border-gray-700 bg-gray-800/30">
                <p className="text-sm text-gray-400 mb-1">{pkg.name}</p>
                <p className="text-2xl font-bold text-white">¥{pkg.price}</p>
                <p className="text-sm text-purple-400 mt-1">{pkg.credits} 积分</p>
              </div>
            ))}
          </div>
          
          <Link href="/pricing" className="inline-block mt-8">
            <Button variant="outline">了解更多</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>© 2024 GPT Image. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
