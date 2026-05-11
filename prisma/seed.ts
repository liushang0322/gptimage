import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash("admin123456", 12)
  
  const admin = await prisma.user.upsert({
    where: { email: "admin@lshang.top" },
    update: {},
    create: {
      email: "admin@lshang.top",
      password: adminPassword,
      name: "管理员",
      role: "ADMIN",
      credits: 9999,
    },
  })

  console.log("Admin user created:", admin.email)

  // Create system configs
  const configs = [
    { key: "site_name", value: "GPT Image", description: "站点名称" },
    { key: "new_user_credits", value: "20", description: "新用户注册赠送积分" },
    { key: "alipay_qrcode", value: "", description: "支付宝收款码图片路径" },
  ]

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config,
    })
  }

  console.log("System configs initialized")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
