# GPT Image 部署文档

## 项目信息

| 项目 | 内容 |
|------|------|
| 技术栈 | Next.js 16 + PostgreSQL + Prisma + NextAuth.js |
| GitHub | https://github.com/liushang0322/gptimage |
| 镜像仓库 | ghcr.io/liushang0322/gptimage:latest |
| 访问域名 | https://image.lshang.top |
| 反向代理 | Caddy（已部署于服务器） |
| 管理员账号 | 821453661@qq.com / Liushang993228@ |

---

## 一、CI/CD 说明

每次 push 到 `master` 分支，GitHub Actions 自动：
1. `npm ci` 安装依赖
2. `npx prisma generate` 生成 Prisma 客户端
3. `npx next build` 构建 Next.js standalone 输出
4. 打包 Docker 镜像推送到 `ghcr.io/liushang0322/gptimage:latest`

> **注意**：Next.js 16 standalone 输出是嵌套结构，`server.js` 在 `.next/standalone/<pkgname>/server.js`，
> CI workflow 会自动查找正确路径并打包。

---

## 二、服务器首次部署

### 1. 克隆代码

```bash
git clone https://github.com/liushang0322/gptimage.git ~/gptimage
cd ~/gptimage
```

### 2. 创建 .env 文件

```bash
cat > ~/gptimage/.env << 'EOF'
NEXTAUTH_SECRET=你的随机字符串（用 openssl rand -base64 32 生成）
OPENAI_API_KEY=sk-你的OpenAI API Key
EOF
```

### 3. 配置 Caddy 反向代理

```bash
# 检查是否已配置
grep -q "image.lshang.top" /opt/caddy/Caddyfile || cat caddy/gptimage.conf >> /opt/caddy/Caddyfile

# 重载 Caddy
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```

### 4. 启动服务

```bash
cd ~/gptimage
docker compose pull
docker compose up -d
```

### 5. 初始化数据库

**方式A：如果服务器资源够用**
```bash
docker compose run --rm migrate
docker compose run --rm app npx tsx prisma/seed.ts
```

**方式B：服务器内存不足时，手动建表**

```bash
docker exec -it gptimage-db psql -U gptimage -d gptimage
```

然后执行以下 SQL：

```sql
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "ImageMode" AS ENUM ('TEXT_TO_IMAGE', 'IMAGE_TO_IMAGE');
CREATE TYPE "Quality" AS ENUM ('STANDARD', 'HD');
CREATE TYPE "ImageStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'EXPIRED');
CREATE TYPE "CreditType" AS ENUM ('RECHARGE', 'CONSUME', 'GIFT', 'REFUND', 'ADMIN_ADJUST');

CREATE TABLE "User" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  avatar TEXT,
  credits INTEGER NOT NULL DEFAULT 20,
  role "Role" NOT NULL DEFAULT 'USER',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "Image" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"(id),
  prompt TEXT NOT NULL,
  "negativePrompt" TEXT,
  mode "ImageMode" NOT NULL DEFAULT 'TEXT_TO_IMAGE',
  size TEXT NOT NULL DEFAULT '1024x1024',
  quality "Quality" NOT NULL DEFAULT 'STANDARD',
  count INTEGER NOT NULL DEFAULT 1,
  "creditCost" INTEGER NOT NULL,
  status "ImageStatus" NOT NULL DEFAULT 'PENDING',
  "imageUrls" TEXT[] NOT NULL DEFAULT '{}',
  "referenceUrl" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "Order" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"(id),
  amount FLOAT NOT NULL,
  credits INTEGER NOT NULL,
  status "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "paymentMethod" TEXT NOT NULL DEFAULT 'alipay',
  "transactionId" TEXT,
  "packageName" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "confirmedAt" TIMESTAMP,
  "confirmedBy" TEXT
);

CREATE TABLE "CreditLog" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"(id),
  amount INTEGER NOT NULL,
  type "CreditType" NOT NULL,
  description TEXT NOT NULL,
  "relatedId" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "SystemConfig" (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "_prisma_migrations" (
  id VARCHAR(36) PRIMARY KEY,
  checksum VARCHAR(64) NOT NULL,
  finished_at TIMESTAMPTZ,
  migration_name VARCHAR(255) NOT NULL,
  logs TEXT,
  rolled_back_at TIMESTAMPTZ,
  applied_steps_count INTEGER NOT NULL DEFAULT 0
);
```

### 6. 创建管理员账号

密码需要先用 bcrypt 加密，在本地执行：
```bash
node -e "const b=require('bcryptjs'); b.hash('你的密码',12).then(h=>console.log(h))"
```

然后在 psql 里插入：
```sql
INSERT INTO "User" (id, email, password, name, role, credits, "createdAt", "updatedAt")
VALUES (
  'admin001',
  '你的邮箱',
  '上面生成的hash',
  '管理员',
  'ADMIN',
  9999,
  NOW(),
  NOW()
);
```

---

## 三、日常更新部署

```bash
# 1. 推送代码到 master，等 GitHub Actions 构建完成（约 3-5 分钟）

# 2. 服务器上拉取新镜像重启
cd ~/gptimage
docker compose pull
docker compose up -d
```

---

## 四、常用命令

```bash
# 查看容器状态
cd ~/gptimage && docker compose ps

# 查看 app 日志
docker compose logs app --tail=50 -f

# 重启 app
docker compose restart app

# 进入数据库
docker exec -it gptimage-db psql -U gptimage -d gptimage

# 查看所有用户
docker exec -it gptimage-db psql -U gptimage -d gptimage -c 'SELECT email, role, credits FROM "User";'
```

---

## 五、已知问题和解决方案

### 问题1：CI Docker 构建失败 - Cannot find module '../constant'

**原因**：Next.js 16 standalone 输出嵌套在子目录 `.next/standalone/<pkgname>/`，
直接复制 `.next/standalone/` 目录导致路径不对。

**解决**：CI workflow 中用 `find` 定位 `server.js`，以其所在目录为 APP_DIR 打包。

### 问题2：服务器内存不足，docker build / migrate 卡死

**原因**：服务器资源太少（1核1G之类），Next.js build 吃满 CPU/内存。

**解决**：用 GitHub Actions 构建镜像，服务器只负责 `docker pull` 和运行。
数据库初始化用手动 SQL 替代 `prisma migrate`。

### 问题3：docker-compose 命令找不到

**解决**：用 `docker compose`（空格，无横杠）。

### 问题4：git push 被墙

**解决**：
```powershell
$env:HTTPS_PROXY="http://127.0.0.1:7897"
git push
```

---

## 六、页面路由

| 路由 | 功能 |
|------|------|
| `/` | 首页 |
| `/login` | 登录 |
| `/register` | 注册（送20积分） |
| `/generate` | 生成图片（文生图/图生图） |
| `/gallery` | 我的图库 |
| `/pricing` | 充值页面 |
| `/pay?orderId=xxx` | 支付页面 |
| `/dashboard` | 用户中心 |
| `/admin` | 管理后台 |
| `/admin/users` | 用户管理 |
| `/admin/orders` | 订单管理 |

---

## 七、积分定价

| 充值包 | 价格 | 积分 |
|--------|------|------|
| 体验包 | ¥9.9 | 100 |
| 标准包 | ¥29.9 | 350 |
| 高级包 | ¥59.9 | 800 |
| 专业包 | ¥99.9 | 1500 |

| 操作 | 消耗积分 |
|------|----------|
| 文生图 标准 1024x1024 | 10 |
| 文生图 横/竖版 | 15 |
| 文生图 HD | 15-23 |
| 图生图 | 10-15 |
| 每额外1张 | +8 |

---

## 八、支付宝收款码配置

支付页面 `/pay` 默认显示二维码占位图，需要替换为真实收款码：

在 `src/app/pay/page.tsx` 找到 QrCode 占位部分，替换为：
```tsx
<img src="/uploads/alipay-qrcode.png" alt="支付宝收款码" className="w-48 h-48 mx-auto" />
```

然后把收款码图片上传到服务器：
```bash
docker cp alipay-qrcode.png gptimage-app:/app/public/uploads/alipay-qrcode.png
```
