# 快速部署指南

## 1. 环境准备

确保已安装：
- Node.js 18+
- Docker & Docker Compose
- pnpm（推荐）或 npm

## 2. 安装步骤

### 2.1 克隆并安装依赖

```bash
# 安装依赖
npm install
# 或使用 pnpm
pnpm install
```

### 2.2 启动数据库

```bash
# 启动 PostgreSQL 和 Redis
docker-compose up -d

# 检查状态
docker-compose ps
```

### 2.3 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，修改以下配置：
# - JWT_SECRET: 修改为随机字符串（至少 32 字符）
# - ENCRYPTION_KEY: 必须是 32 字符
# - REDIS_PASSWORD: Redis 密码（与 docker-compose.yml 中保持一致）
```

### 2.4 初始化数据库

```bash
# 一键初始化（推荐）
npm run db:setup

# 这个命令会自动执行：
# 1. 同步环境变量到 Prisma
# 2. 安装 Prisma 依赖
# 3. 生成 Prisma Client
# 4. 运行数据库迁移
# 5. 初始化 DNS Provider 数据
```

**注意：** 首次运行会自动安装 packages/database 的依赖

或者分步执行：

```bash
npm run db:generate  # 生成 Prisma Client（包含环境变量同步和依赖安装）
npm run db:migrate   # 运行迁移
npm run db:seed      # 初始化数据
```

### 2.5 启动开发服务器

```bash
npm run dev
```

API 将运行在 `http://localhost:3001`

## 3. 测试 API

### 3.1 注册用户

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### 3.2 登录获取 Token

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

保存返回的 `token`，后续请求需要使用。

### 3.3 添加 DNS 账号

首先获取 Provider ID：

```bash
# 打开 Prisma Studio
npm run db:studio

# 在浏览器中查看 dns_providers 表，复制 Cloudflare 的 ID
```

然后添加账号：

```bash
curl -X POST http://localhost:3001/api/dns-accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "providerId": "CLOUDFLARE_PROVIDER_ID",
    "credentials": {
      "apiToken": "your-cloudflare-api-token"
    },
    "isDefault": true
  }'
```

### 3.4 创建域名记录

```bash
curl -X POST http://localhost:3001/api/domains \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "dnsAccountId": "YOUR_DNS_ACCOUNT_ID",
    "subdomain": "test.yourdomain.com",
    "recordType": "A",
    "value": "1.2.3.4",
    "ttl": 300
  }'
```

## 4. 获取 Cloudflare API Token

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 点击右上角头像 → My Profile
3. 左侧菜单选择 API Tokens
4. 点击 Create Token
5. 使用 "Edit zone DNS" 模板
6. 选择需要管理的域名
7. 创建并复制 Token

## 5. 获取阿里云 AccessKey

1. 登录 [阿里云控制台](https://ram.console.aliyun.com/)
2. 访问控制 → 用户 → 创建用户
3. 勾选 "OpenAPI 调用访问"
4. 添加权限：AliyunDNSFullAccess
5. 保存 AccessKey ID 和 Secret

## 6. 常见问题

### 数据库连接失败

```bash
# 检查 Docker 容器状态
docker-compose ps

# 查看日志
docker-compose logs postgres
```

### Prisma 迁移失败

```bash
# 重置数据库（会删除所有数据）
cd packages/database
prisma migrate reset

# 重新迁移
prisma migrate dev
```

### 端口被占用

修改 `.env` 中的 `PORT` 配置，或停止占用端口的进程。

## 7. 生产部署

### 使用 Railway

1. 连接 GitHub 仓库
2. 添加 PostgreSQL 和 Redis 服务
3. 配置环境变量
4. 部署 `apps/api`

### 使用 Docker

```bash
# 构建镜像
docker build -t kagerou-api -f apps/api/Dockerfile .

# 运行
docker run -p 3001:3001 --env-file .env kagerou-api
```

## 8. 下一步

- 查看 [README.md](./README.md) 了解完整 API 文档
- 添加更多 DNS Provider
- 实现前端管理界面
- 添加 API 限流和监控
