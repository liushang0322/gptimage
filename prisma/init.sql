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
  amount DOUBLE PRECISION NOT NULL,
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

CREATE INDEX "Image_userId_createdAt_idx" ON "Image" ("userId", "createdAt" DESC);
CREATE INDEX "Image_status_createdAt_idx" ON "Image" (status, "createdAt" DESC);
CREATE INDEX "Order_userId_createdAt_idx" ON "Order" ("userId", "createdAt" DESC);
CREATE INDEX "Order_status_createdAt_idx" ON "Order" (status, "createdAt" DESC);
CREATE INDEX "CreditLog_userId_createdAt_idx" ON "CreditLog" ("userId", "createdAt" DESC);

INSERT INTO "SystemConfig" (id, key, value, description, "updatedAt")
VALUES
  ('site_name', 'site_name', 'GPT Image', '站点名称', NOW()),
  ('new_user_credits', 'new_user_credits', '20', '新用户注册赠送积分', NOW()),
  ('alipay_qrcode', 'alipay_qrcode', '', '支付宝收款码图片路径', NOW());
