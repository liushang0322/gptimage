# GPT Image 部署文档

这个项目的目标部署形态是：

- GitHub Actions 或本地开发机负责构建镜像
- `2C/2G` 服务器只负责 `docker pull` 和运行容器
- 外网通过 Caddy 反代到 `image.lshang.top`

不要在服务器上直接跑 `next build`。这台机器的 CPU 和内存不适合做 Next 16 生产构建。

## 1. 部署前提

- 域名 `image.lshang.top` 的 DNS 已解析到服务器公网 IP
- 服务器已安装 Docker 和 `docker compose`
- 服务器上的 Caddy 容器与本项目容器共享 `web` 网络
- GitHub Container Registry 上的镜像可拉取：`ghcr.io/liushang0322/gptimage:latest`

如果 `web` 网络还不存在，先执行：

```bash
docker network create web
```

## 2. 首次部署

### 2.1 拉代码

```bash
git clone https://github.com/liushang0322/gptimage.git ~/gptimage
cd ~/gptimage
```

### 2.2 创建环境变量

```bash
cp .env.example .env
```

至少修改这些值：

```env
POSTGRES_PASSWORD=换成你自己的数据库密码
NEXTAUTH_SECRET=用 openssl rand -base64 32 生成
OPENAI_API_KEY=sk-你的 OpenAI Key
NEXTAUTH_URL=https://image.lshang.top
NEXT_PUBLIC_APP_URL=https://image.lshang.top
```

### 2.3 配置 Caddy

把 `caddy/gptimage.conf` 中的站点配置追加到你的 Caddyfile。实际内容是：

```caddy
image.lshang.top {
    reverse_proxy gptimage-app:3000

    request_body {
        max_size 20MB
    }

    header {
        X-Forwarded-Proto https
        X-Forwarded-Host {host}
    }
}
```

然后重载 Caddy：

```bash
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```

### 2.4 启动服务

```bash
cd ~/gptimage
docker compose pull
docker compose up -d
```

现在数据库会在第一次启动时自动执行 `prisma/init.sql` 建表，不再依赖 `prisma migrate`。

### 2.5 验证

```bash
docker compose ps
docker compose logs app --tail=100
docker compose logs db --tail=100
```

如果日志正常，直接访问：

```text
https://image.lshang.top
```

## 3. 创建管理员

当前项目没有自动创建管理员的安全引导流程，推荐这样做：

1. 先在网页上正常注册一个账号
2. 进入数据库把它提升为管理员

```bash
docker exec -it gptimage-db sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

执行：

```sql
UPDATE "User"
SET role = 'ADMIN'
WHERE email = '你的邮箱';
```

如果想顺手补积分：

```sql
UPDATE "User"
SET credits = 9999
WHERE email = '你的邮箱';
```

## 4. 日常更新

```bash
cd ~/gptimage
git pull
docker compose pull
docker compose up -d
```

如果代码已经 push 到 `master`，只需要等 GitHub Actions 把新镜像推到 GHCR，再在服务器执行上面三条命令。

## 5. 常用命令

```bash
docker compose ps
docker compose logs app --tail=100 -f
docker compose restart app
docker exec -it gptimage-db sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

## 6. 当前已知限制

- 支付仍然是“人工确认订单”流程，不是自动支付回调
- `/pay` 页面默认还是二维码占位，需要你换成真实收款码
- Prisma migration 流程目前未建立，当前版本依赖 `prisma/init.sql` 做首发初始化
